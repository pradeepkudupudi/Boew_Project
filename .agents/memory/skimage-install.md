---
name: scikit-image install
description: How to install Python packages in this NixOS Replit environment.
---
**Rule:** `pip install` (and `python3 -m pip install`) fail with "externally-managed-environment" on this NixOS Replit. Use `python3 -m pip install --target /home/runner/workspace/.pythonlibs <package>`.

**Why:** NixOS prevents system-level pip installs without `--break-system-packages`. The `.pythonlibs` target dir is already used by the project.

**How to apply:** In ML service code, add `.pythonlibs` to `sys.path` at startup:
```python
_plib = Path(__file__).parent.parent / ".pythonlibs"
if _plib.exists() and str(_plib) not in sys.path:
    sys.path.insert(0, str(_plib))
```
scikit-image 0.26.0 and scipy 1.17.1 are installed. faiss-cpu 1.9.0 crashes on import (SuperKMeans NameError) — guarded with try/except.
