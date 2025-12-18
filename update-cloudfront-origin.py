#!/usr/bin/env python3
import json
import subprocess
import sys

distribution_id = "E2E9W88J7RQDGY"
new_bucket = "crowdsense-web-20251217120949"
new_region = "ap-southeast-2"
new_origin_domain = f"{new_bucket}.s3.{new_region}.amazonaws.com"
new_origin_id = f"{new_bucket}-s3-origin"

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

# Update origin
dist_config["Origins"]["Items"][0]["DomainName"] = new_origin_domain
dist_config["Origins"]["Items"][0]["Id"] = new_origin_id

# Update default cache behavior
dist_config["DefaultCacheBehavior"]["TargetOriginId"] = new_origin_id

# Save to temp file
temp_file = "cloudfront-update-config.json"
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
    print(f"✅ CloudFront 배포 업데이트 완료!")
    print(f"   ID: {dist['Id']}")
    print(f"   상태: {dist['Status']}")
    print(f"   도메인: {dist['DomainName']}")
    print(f"   새 Origin: {new_origin_domain}")
else:
    print(f"❌ 업데이트 실패: {update_result.stderr}")
    sys.exit(1)
