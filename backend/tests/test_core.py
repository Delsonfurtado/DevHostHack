import sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).parents[1]))
sys.path.insert(0,str(Path(__file__).parents[1]/'training'))
from app.main import zone_for, who_band, quality_check, FEATURES as API_FEATURES, ROI as API_ROI
from features import FEATURES, ROI, features_from_rgb

def test_zones_and_danger():
    assert zone_for(10, .2, 11, False)=='red'
    assert zone_for(11, .2, 11, False)=='amber'
    assert zone_for(12, .2, 11, False)=='green'
    assert zone_for(14, .1, 11, True)=='red'

def test_who_bands():
    assert who_band(6.9,'child_6_59m')=='Severe'
    assert who_band(9,'child_6_59m')=='Moderate'
    assert who_band(10.5,'child_6_59m')=='Mild'
    assert who_band(12,'child_6_59m')=='No anaemia by listed threshold'

def test_quality_checks_reject_blank():
    result=quality_check(Image.new('RGB',(200,200),(255,255,255)))
    assert not result['passed'] and not result['glare']

def test_training_feature_parity():
    assert FEATURES==API_FEATURES and ROI==API_ROI
    pixels=np.arange(6*7*3,dtype=np.uint8).reshape(6,7,3)
    assert np.allclose(features_from_rgb(pixels), __import__('app.main',fromlist=['features_from_rgb']).features_from_rgb(pixels))
