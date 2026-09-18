import requests

BASE_URL = "http://localhost:8000/api/v1"

CASES = {
    "1. Machine Guarding (High SIF)": """During routine maintenance of a centrifugal pump, a technician removed the protective guard from the rotating coupling to inspect the equipment. The pump was restarted while the guard was still removed. The technician was working within close proximity to the exposed rotating coupling and could have been caught in the moving equipment. No machine guarding was in place when the equipment was operated.""",
    
    "2. Pressure Isolation (High SIF)": """During routine process piping maintenance, a technician prepared to loosen bolts on a pipe flange downstream of an isolation valve. The upstream valve was closed, but zero pressure verification was not performed before breaking the flange connection. Residual line pressure remained trapped in the section. When the flange was unbolted, pressurized liquid sprayed out toward the technician. Isolation had not been verified prior to starting line breaking.""",
    
    "3. Office Observation (Low Risk / Non-SIF)": """During a daily walkthrough of the administrative building, an employee noticed a loose armrest on an office chair in the second-floor conference room. The armrest wobbled slightly when pressed. No injuries occurred, and the chair was tagged for maintenance."""
}

def verify():
    for label, text in CASES.items():
        print(f"\n==========================================")
        print(f"VERIFYING CASE: {label}")
        print(f"==========================================")
        
        # 1. Import
        imp_resp = requests.post(
            f"{BASE_URL}/reports/import",
            files={"file": ("narrative.txt", text.encode("utf-8"), "text/plain")},
            data={"source": "oil_hsse"}
        )
        assert imp_resp.status_code == 200, f"Import failed: {imp_resp.text}"
        report_id = imp_resp.json()["first_imported_id"]
        
        # 2. Analyze
        anl_resp = requests.post(f"{BASE_URL}/reports/{report_id}/analyze")
        assert anl_resp.status_code == 200, f"Analysis failed: {anl_resp.text}"
        data = anl_resp.json()
        
        sif = data.get("sif", {})
        ext = data.get("extraction", {})
        fp = data.get("fingerprint", {})
        lsr = data.get("life_saving_rules", [])
        sim = data.get("similar_reports", [])

        print(f"-> Report ID: {report_id}")
        print(f"-> Trace ID: {data.get('trace_id')}")
        print(f"-> SIF Classification: {sif.get('classification')} (Score: {sif.get('score'):.4f}, Conf: {sif.get('confidence'):.4f})")
        print(f"-> Activity: {ext.get('activity')}")
        print(f"-> Hazard: {ext.get('hazard')}")
        print(f"-> Energy Source: {ext.get('energy_source')}")
        print(f"-> Failed Barrier: {ext.get('barrier_failure') or ext.get('barrier')}")
        print(f"-> Primary LSR: {lsr[0]['rule_name'] if lsr else 'None'}")
        print(f"-> BGE Similar Reports Count (Deduplicated): {len(sim)}")
        if sim:
            print(f"   Top Match: #{sim[0]['source_record_id']} ({sim[0]['similarity']*100:.1f}%)")

if __name__ == "__main__":
    verify()
