# 계정 검증 가이드

## 현재 상황

IAM 사용자(`ilhyuk`)로 로그인되어 있어서 Account Settings에 접근할 수 없습니다.

에러 메시지:
```
You don't have the account:GetAccountInformation and billing:GetSellerOfRecord permission required to view your account settings.
```

## 해결 방법

### 방법 1: 루트 계정으로 로그인 (권장)

1. AWS Console에서 로그아웃
2. **루트 계정**으로 로그인 (이메일 주소 사용)
3. Account Settings 접근
4. Identity Verification 완료

**주의**: 루트 계정은 매우 강력한 권한을 가지므로, MFA(Multi-Factor Authentication) 활성화를 권장합니다.

### 방법 2: IAM 사용자에게 권한 추가

루트 계정 관리자에게 다음 권한 추가를 요청:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "account:GetAccountInformation",
                "billing:GetSellerOfRecord"
            ],
            "Resource": "*"
        }
    ]
}
```

하지만 **계정 검증은 루트 계정에서만 가능**할 수 있으므로, 방법 1을 권장합니다.

### 방법 3: AWS Support를 통한 계정 검증

이미 보낸 Support 요청을 통해 계정 검증을 요청할 수 있습니다.

1. AWS Support Console 접속
2. 보낸 케이스 확인
3. 추가 정보 제공 (필요시)

## 계정 검증 체크리스트

루트 계정으로 로그인한 후:

- [ ] Account Settings 접근 가능 확인
- [ ] Identity Verification 섹션 확인
- [ ] 전화번호 인증 완료
- [ ] 이메일 인증 완료
- [ ] 결제 방법 추가 (필요시)
- [ ] 주소 확인 완료

## CloudFront 배포 재시도

계정 검증 완료 후:

```powershell
# 간단한 방법
aws cloudfront create-distribution --origin-domain-name crowdsense-web-20251213095230.s3.ap-northeast-2.amazonaws.com --default-root-object index.html

# 또는 상세 구성 파일 사용
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## 참고

- IAM 사용자는 계정 설정 변경 권한이 제한될 수 있습니다
- 계정 검증은 보안상 루트 계정에서만 가능할 수 있습니다
- 교육용 계정도 결제 방법 추가가 필요할 수 있습니다
