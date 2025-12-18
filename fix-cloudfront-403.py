#!/usr/bin/env python3
import json
import subprocess
import sys

distribution_id = "E2E9W88J7RQDGY"

# Get current config
result = subprocess.run(
    ["aws", "cloudfront", "get-distribution-config", "--id", distribution_id, "--output", "json"],
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"Error getting distribution config: {result.stderr}")
    sys.exit(1)

config = json.loads(result.stdout)
etag = config["ETag"]
dist_config = config["DistributionConfig"]

# Remove 403 Custom Error Response
if "CustomErrorResponses" in dist_config:
    error_responses = dist_config["CustomErrorResponses"].get("Items", [])
    # Filter out 403 errors
    filtered_responses = [r for r in error_responses if r.get("ErrorCode") != 403]
    dist_config["CustomErrorResponses"]["Items"] = filtered_responses
    dist_config["CustomErrorResponses"]["Quantity"] = len(filtered_responses)

# Save to temp file
temp_file = "cloudfront-fixed-403.json"
with open(temp_file, "w", encoding="utf-8") as f:
    json.dump(dist_config, f, ensure_ascii=False, indent=2)

# Update distribution
update_result = subprocess.run(
    [
        "aws", "cloudfront", "update-distribution",
        "--id", distribution_id,
        "--if-match", etag,
        "--distribution-config", f"file://{temp_file}",
        "--output", "json"
    ],
    capture_output=True,
    text=True
)

if update_result.returncode == 0:
    updated = json.loads(update_result.stdout)
    dist = updated["Distribution"]
    print(f"✅ CloudFront 업데이트 완료!")
    print(f"   ID: {dist['Id']}")
    print(f"   상태: {dist['Status']}")
    print(f"   도메인: {dist['DomainName']}")
    print(f"\n💡 403 Custom Error Response 제거됨")
    print(f"   이제 /api/parking의 403 에러가 JSON으로 반환됩니다")
    print(f"\n⚠️  배포 완료까지 약 10-15분 소요됩니다")
else:
    print(f"❌ 업데이트 실패: {update_result.stderr}")
    sys.exit(1)
