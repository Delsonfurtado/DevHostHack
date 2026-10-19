"""Shared image feature contract. Keep ROI and formulas in parity with app/main.py."""
ROI = (0.20, 0.35, 0.60, 0.40)
FEATURES = ["mean_r", "mean_g", "mean_b", "red_green", "red_blue", "green_blue"]

def features_from_rgb(rgb):
    means = rgb.reshape(-1, 3).mean(axis=0) / 255.0
    r, g, b = means
    eps = 1e-6
    return [float(r), float(g), float(b), float(r / (g + eps)), float(r / (b + eps)), float(g / (b + eps))]
