---
name: HOG feature extractor
description: Real visual feature extractor using scikit-image HOG + color histograms, 2700 dims.
---
**Rule:** The active extractor is HOG + color histogram from scikit-image (2700 dims). Extractor tag `hog-color-2700` is saved to `faiss_index/extractor_tag.txt`. On startup, if tag differs from saved tag AND matrix is empty, auto re-index runs.

**Why:** TF/ResNet50 unavailable (pip blocked). scikit-image installed to `.pythonlibs`. HOG (1764 dims) + global color hist (96 dims) + quadrant color hist (192 dims) + per-channel HOG (648 dims) = 2700 dims total.

**How to apply:** When ResNet50 becomes available later, extractor tag will change to `resnet50-2048`, triggering auto re-index on next startup. Feature dim is detected dynamically via `_probe_feature_dim()` — no hardcoded constant.
