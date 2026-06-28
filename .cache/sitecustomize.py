import os
import tempfile

_tmp = os.environ.get("TEMP") or os.environ.get("TMP")
if _tmp:
    tempfile.tempdir = _tmp
