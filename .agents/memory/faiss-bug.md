---
name: FAISS 1.9.0 Import Bug
description: faiss-cpu 1.9.0 crashes on import with a NameError; requires try/except guard.
---

faiss-cpu 1.9.0 raises `NameError: name 'SuperKMeans' is not defined` on `import faiss`.

**Why:** The 1.9.0 release has a broken stub that references an undefined symbol at import time.

**How to apply:** Always wrap `import faiss` in a try/except in any Python file that uses FAISS:
```python
try:
    import faiss
    FAISS_AVAILABLE = True
except Exception:
    FAISS_AVAILABLE = False
```
Then gate all FAISS usage on `FAISS_AVAILABLE` and fall back to NumPy cosine/euclidean search. The NumPy fallback uses normalized dot products for cosine and `np.linalg.norm` for L2 distance.
