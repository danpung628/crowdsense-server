# EC2 배포 및 환경 비교 가이드

## 📋 목차
1. [로컬 vs EC2 환경 비교](#로컬-vs-ec2-환경-비교)
2. [EC2 배포 준비](#ec2-배포-준비)  
3. [EC2 인스턴스 설정](#ec2-인스턴스-설정)
4. [애플리케이션 배포](#애플리케이션-배포)
5. [S3 연동 설정](#s3-연동-설정)
6. [문제 해결](#문제-해결)

---

## 🔄 로컬 vs EC2 환경 비교

### 📍 로컬 환경 (기존)
| 구성 요소 | 로컬 환경 | 특징 |
|-----------|-----------|------|
| **서버** | Node.js (localhost:3000) | 개발용, 빠른 테스트 |
| **데이터베이스** | MongoDB (로컬 설치) | 단일 개발자용 |
| **캐시** | Redis (로컬 설치) | 로컬 메모리 사용 |
| **파일 저장** | 로컬 파일 시스템 | `src/data/parkingCoordinates.json` |
| **네트워크** | 로컬호스트만 접근 | 외부 접근 불가 |
| **확장성** | 제한적 | 단일 머신 성능에 의존 |

### ☁️ EC2 환경 (클라우드)
| 구성 요소 | EC2 환경 | 특징 |
|-----------|----------|------|
| **서버** | EC2 인스턴스 (퍼블릭 IP) | 운영용, 외부 접근 가능 |
| **데이터베이스** | EC2 내부 MongoDB | 클라우드에서 관리 |
| **캐시** | EC2 내부 Redis | 독립적인 캐시 서버 |
| **파일 저장** | S3 버킷 + 로컬 백업 | 클라우드 스토리지, 백업 |
| **네트워크** | 인터넷을 통한 접근 | 글로벌 접근 가능 |
| **확장성** | 높음 | 인스턴스 크기 조정 가능 |

### 📊 주요 차이점

#### 1. 파일 저장 방식
- **로컬**: 파일 시스템에만 저장 → 서버 재시작 시 데이터 유지
- **EC2**: S3 우선, 로컬 백업 → 인스턴스 교체 시에도 데이터 안전

#### 2. 네트워크 접근
- **로컬**: `http://localhost:3000`
- **EC2**: `http://[EC2-PUBLIC-IP]:3000`

#### 3. 데이터 백업 및 복원
- **로컬**: 수동 백업 필요
- **EC2**: S3 자동 동기화, AWS 백업 정책 활용 가능

---

## 🚀 EC2 배포 준비

### 1. AWS 계정 및 서비스 설정

#### EC2 인스턴스 생성
```bash
# 권장 사양
- Instance Type: t3.micro (프리티어) 또는 t3.small
- OS: Ubuntu 22.04 LTS
- Storage: 20GB EBS (gp3)
- Security Group: HTTP(80), HTTPS(443), SSH(22), Custom(3000)
```

#### S3 버킷 생성
```bash
# AWS CLI 또는 콘솔에서
aws s3 mb s3://crowdsense-data-bucket --region ap-northeast-2
```

#### IAM 역할 생성
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject", 
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::crowdsense-data-bucket",
        "arn:aws:s3:::crowdsense-data-bucket/*"
      ]
    }
  ]
}
```

---

## ⚙️ EC2 인스턴스 설정

### 1. 기본 패키지 업데이트
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Node.js 설치
```bash
# Node.js 18.x 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

### 3. MongoDB 설치
```bash
# MongoDB 설치
sudo apt update
sudo apt install -y mongodb

# MongoDB 시작 및 자동 시작 설정
sudo systemctl start mongodb
sudo systemctl enable mongodb

# 상태 확인
sudo systemctl status mongodb
```

### 4. Redis 설치
```bash
# Redis 설치
sudo apt update
sudo apt install -y redis-server

# Redis 시작 및 자동 시작 설정  
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 상태 확인
sudo systemctl status redis-server
```

### 5. Git 설치
```bash
sudo apt install -y git
```

---

## 📦 애플리케이션 배포

### 1. 소스코드 클론
```bash
# 홈 디렉토리로 이동
cd ~

# 저장소 클론 (실제 저장소 URL로 변경)
git clone https://github.com/your-username/crowdsense-server.git
cd crowdsense-server/server
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 설정
```bash
# EC2용 환경 파일 복사
cp env.ec2.example .env

# 환경 파일 수정
nano .env
```

#### `.env` 파일 설정 예시
```bash
# 반드시 수정해야 할 항목들
ENVIRONMENT_MODE=ec2
AWS_S3_BUCKET_NAME=your-actual-bucket-name
JWT_SECRET=your-strong-secret-key-here
JWT_REFRESH_SECRET=your-strong-refresh-secret-key-here
DEV_FLAG=0
```

### 4. 애플리케이션 실행 테스트
```bash
# 일회성 실행
npm start

# 백그라운드 실행 (PM2 사용)
sudo npm install -g pm2
pm2 start server.js --name crowdsense
pm2 save
pm2 startup
```

---

## 📂 S3 연동 설정

### 1. S3 동작 확인
```bash
# 서버 로그에서 S3 연결 확인
pm2 logs crowdsense

# 다음과 같은 메시지가 나와야 함:
# "🔧 S3 클라이언트 초기화 완료 (ec2 모드)"
# "📡 S3에서 주차장 좌표 로드 시도..."
```

### 2. 데이터 동기화 확인  
```bash
# API 호출하여 주차장 데이터 생성/업로드 테스트
curl http://localhost:3000/api/parking/강남구

# S3 버킷에서 파일 확인
aws s3 ls s3://your-bucket-name/data/
```

### 3. 로컬과 S3 데이터 비교
```bash
# 로컬 파일 확인
ls -la ~/crowdsense-server/server/src/data/

# S3 파일 다운로드하여 비교
aws s3 cp s3://your-bucket-name/data/parkingCoordinates.json ./s3-backup.json
diff ./src/data/parkingCoordinates.json ./s3-backup.json
```

---

## 🔧 문제 해결

### 일반적인 오류들

#### 1. MongoDB 연결 실패
```bash
# MongoDB 상태 확인
sudo systemctl status mongodb

# MongoDB 재시작
sudo systemctl restart mongodb

# 포트 확인
sudo netstat -tlnp | grep :27017
```

#### 2. Redis 연결 실패  
```bash
# Redis 상태 확인
sudo systemctl status redis-server

# Redis 재시작
sudo systemctl restart redis-server

# 연결 테스트
redis-cli ping
```

#### 3. S3 권한 오류
```bash
# IAM 역할이 EC2에 연결되었는지 확인
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# AWS CLI 설정 확인 (IAM 역할 사용시 불필요)
aws configure list
```

#### 4. 포트 접근 문제
```bash
# 3000 포트가 열려있는지 확인
sudo netstat -tlnp | grep :3000

# 방화벽 설정 확인 (Ubuntu)
sudo ufw status

# 방화벽에서 3000 포트 열기
sudo ufw allow 3000
```

### 로그 확인 방법
```bash
# PM2 로그
pm2 logs crowdsense

# 시스템 로그
sudo journalctl -u mongodb
sudo journalctl -u redis-server

# 애플리케이션 직접 실행 (디버깅용)
cd ~/crowdsense-server/server
npm start
```

---

## 📈 성능 및 모니터링

### EC2 리소스 모니터링
```bash
# CPU, 메모리 사용량 확인
htop

# 디스크 사용량 확인  
df -h

# PM2 프로세스 모니터링
pm2 monit
```

### AWS 모니터링
- **CloudWatch**: EC2 인스턴스 메트릭
- **S3**: 스토리지 사용량 및 요청 수
- **Cost Explorer**: 비용 추적

---

## 🎯 배포 완료 체크리스트

- [ ] EC2 인스턴스 생성 및 보안 그룹 설정
- [ ] S3 버킷 생성 및 IAM 역할 연결  
- [ ] MongoDB, Redis, Node.js 설치
- [ ] 애플리케이션 소스코드 배포
- [ ] 환경변수 설정 (`.env`)
- [ ] S3 연동 테스트
- [ ] API 엔드포인트 동작 확인
- [ ] PM2로 백그라운드 실행 설정
- [ ] 모니터링 및 로그 확인

## 🌐 접근 테스트

배포 완료 후 다음 URL들을 테스트하세요:

```
# 기본 페이지
http://[EC2-PUBLIC-IP]:3000/

# API 문서
http://[EC2-PUBLIC-IP]:3000/api-docs

# 주요 API 테스트
http://[EC2-PUBLIC-IP]:3000/api/crowds/POI001
http://[EC2-PUBLIC-IP]:3000/api/parking/강남구
```

---

**🎉 축하합니다! CrowdSense 서버가 AWS EC2에서 성공적으로 실행되고 있습니다!**
