"""Convert VRF_KPI_Master_v2_1.xlsx -> data/kpi-canvas.json for the KPI Canvas screen.

Source sheets:
  KPI_Master      - 50 generic template KPIs (master library)
  KPI_Dept_Custom - department-specific KPIs added during engagements
  VRF_Definitions - ISD / CC / DCS category names + official definitions
"""
import json
import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "VRF_KPI_Master_v2_1.xlsx"
OUT = ROOT / "data" / "kpi-canvas.json"


def clean(v):
    if v is None:
        return None
    if isinstance(v, float) and pd.isna(v):
        return None
    s = str(v).strip()
    return s if s and s.lower() != "nan" else None


def split_tags(v):
    s = clean(v)
    if not s:
        return []
    return [t.strip() for t in re.split(r"[;,]", s) if t.strip()]


def load_categories():
    df = pd.read_excel(XLSX, sheet_name="VRF_Definitions", header=0)
    cats = {}
    for _, r in df.iterrows():
        code = clean(r.get("Code"))
        if not code:
            continue
        cats[code] = {
            "code": code,
            "name": clean(r.get("Category Name")),
            "definition": clean(r.get("Definition")),
        }
    return cats


def load_kpis(sheet, source):
    df = pd.read_excel(XLSX, sheet_name=sheet, header=0)
    out = []
    for _, r in df.iterrows():
        kid = clean(r.get("KPI_ID"))
        if not kid:
            continue
        out.append({
            "id": kid,
            "name": clean(r.get("KPI_Name")),
            "valueCategory": clean(r.get("Value_Category")),
            "kpiType": clean(r.get("KPI_Type")),
            "definition": clean(r.get("Definition")),
            "whatItMeasures": clean(r.get("What_It_Measures")),
            "formula": clean(r.get("Formula_Guidance")),
            "unit": clean(r.get("Unit_of_Measure")),
            "frequency": clean(r.get("Measurement_Freq")),
            "feasibility": clean(r.get("Feasibility")),
            "dataSourceType": clean(r.get("Data_Source_Type")),
            "suggestedSources": clean(r.get("Suggested_Sources")),
            "openDataLink": clean(r.get("Open_Data_Link")),
            "linkTag": clean(r.get("KPI_Link_Tag")),
            "kwTags": split_tags(r.get("KW_Tags")),
            "deptTags": split_tags(r.get("Dept_Tags")),
            "parentId": clean(r.get("Parent_KPI_ID")),
            "notes": clean(r.get("Notes")),
            "source": source,
        })
    return out


def main():
    categories = load_categories()
    kpis = load_kpis("KPI_Master", "master") + load_kpis("KPI_Dept_Custom", "dept")
    # attach the resolved category name onto each KPI for convenient UI rendering
    for k in kpis:
        cat = categories.get(k["valueCategory"]) if k["valueCategory"] else None
        k["valueCategoryName"] = cat["name"] if cat else (k["valueCategory"] or "Uncategorized")

    payload = {
        "version": "2.1.0",
        "source": "VRF_KPI_Master_v2_1.xlsx",
        "categories": categories,
        "kpis": kpis,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT} — {len(kpis)} KPIs, {len(categories)} categories")
    # quick sanity print
    for c in categories.values():
        n = sum(1 for k in kpis if k["valueCategory"] == c["code"])
        print(f"  {c['code']}: {n} KPIs — {c['name']}")


if __name__ == "__main__":
    main()
