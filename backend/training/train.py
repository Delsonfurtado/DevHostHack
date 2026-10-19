"""Train with patient-grouped five-fold CV. Input CSV: image_path, patient_id, hb; images must be locally available.

For Google Colab: upload an openly licensed conjunctiva dataset and CSV, inspect its license/consent,
then run this script with --csv labels.csv --out model.json. No dataset is bundled.
"""
import argparse, json
from pathlib import Path
import numpy as np
from PIL import Image
from sklearn.linear_model import Ridge
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.metrics import mean_absolute_error, roc_auc_score, recall_score, confusion_matrix
from features import ROI, FEATURES, features_from_rgb

def main():
    p=argparse.ArgumentParser(); p.add_argument('--csv',required=True); p.add_argument('--out',default='model.json'); a=p.parse_args()
    import pandas as pd
    df=pd.read_csv(a.csv); required={'image_path','patient_id','hb'}
    if not required.issubset(df.columns): raise SystemExit(f'CSV must include {sorted(required)}')
    X=[]
    for path in df.image_path:
        im=Image.open(path).convert('RGB'); x,y,w,h=ROI
        crop=im.crop((int(im.width*x),int(im.height*y),int(im.width*(x+w)),int(im.height*(y+h)))).resize((80,60))
        X.append(features_from_rgb(np.asarray(crop)))
    X=np.asarray(X); y=df.hb.to_numpy(float); groups=df.patient_id.to_numpy()
    pred=cross_val_predict(Ridge(alpha=1.0),X,y,groups=groups,cv=GroupKFold(n_splits=5))
    cutoff=12.0; label=y<cutoff; score=-pred
    predicted_anemia=pred<cutoff
    tn,fp,fn,tp=confusion_matrix(label,predicted_anemia,labels=[False,True]).ravel()
    metrics={'mae':float(mean_absolute_error(y,pred)),'auroc':float(roc_auc_score(label,score)) if len(set(label))==2 else None,'sensitivity':float(tp/(tp+fn)) if tp+fn else None,'specificity':float(tn/(tn+fp)) if tn+fp else None,'interval_width':float(2*np.std(y-pred)),'images':len(y),'patients':int(df.patient_id.nunique()),'folds':5}
    model=Ridge(alpha=1.0).fit(X,y)
    payload={'name':'Ridge conjunctiva colour model','version':'ridge-1','feature_names':FEATURES,'coefficients':model.coef_.tolist(),'intercept':float(model.intercept_),'interval_half_width':max(.5,float(np.quantile(np.abs(y-pred),.95))),'dataset':str(Path(a.csv).name),'metrics':metrics,'fairness':[],'caveat':'Research prototype; subgroup fairness requires adequate independent patient data.'}
    Path(a.out).write_text(json.dumps(payload,indent=2)); print(json.dumps(metrics,indent=2))
if __name__=='__main__': main()
