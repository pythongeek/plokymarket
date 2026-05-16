#!/usr/bin/env python3
"""
Module E Phase 2 — n8n Workflow Audit Script
Validates that all workflow JSON files have:
  1. Error Trigger node
  2. Retry policies on HTTP Request nodes
  3. Valid JSON structure
"""

import json
import os
import sys

WORKFLOWS_DIR = "/root/workspace/plokymarket/automation/workflows"


def audit_workflow(filepath):
    """Audit a single workflow file. Returns (ok, errors)."""
    errors = []
    try:
        with open(filepath) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return False, [f"Malformed JSON: {e}"]

    nodes = data.get("nodes", [])
    node_types = [n.get("type") for n in nodes]

    # Check error trigger
    if "n8n-nodes-base.errorTrigger" not in node_types:
        errors.append("Missing Error Trigger node")

    # Check HTTP retry policies
    http_nodes = [n for n in nodes if n.get("type") == "n8n-nodes-base.httpRequest"]
    for node in http_nodes:
        opts = node.get("parameters", {}).get("options", {})
        if "retry" not in opts:
            errors.append(f"HTTP node '{node.get('name')}' missing retry policy")

    return len(errors) == 0, errors


def main():
    if not os.path.isdir(WORKFLOWS_DIR):
        print(f"ERROR: Directory not found: {WORKFLOWS_DIR}")
        sys.exit(1)

    total = 0
    passed = 0
    failed_files = []

    for filename in sorted(os.listdir(WORKFLOWS_DIR)):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(WORKFLOWS_DIR, filename)
        total += 1
        ok, errors = audit_workflow(filepath)
        if ok:
            passed += 1
            print(f"  ✓ {filename}")
        else:
            failed_files.append((filename, errors))
            print(f"  ✗ {filename}: {'; '.join(errors)}")

    print(f"\n--- Audit Complete ---")
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")

    if failed_files:
        print("\nFailed workflows:")
        for name, errs in failed_files:
            print(f"  - {name}: {errs}")
        sys.exit(1)
    else:
        print("All workflows validated successfully.")
        sys.exit(0)


if __name__ == "__main__":
    main()
