#!/bin/bash

ip_addresses=$(ifconfig | grep -E '\d{3}\.' | awk '{print $2}')

ip_array=($ip_addresses)

echo "사용 가능한 IP 주소 목록:"
for ((i=0; i<${#ip_array[@]}; i++)); do
    echo "[$i] ${ip_array[i]}"
done

read -p "원하는 IP 주소 번호를 입력하세요: " choice

selected_ip=${ip_array[$choice]}

env_file=".env"

git clone git@github.com:ft-ts/env.git

echo "SERVER_IP='$selected_ip'" > "$env_file"
cat env/.env.local.back >> "$env_file" 

echo ""
echo "✅ .env 파일을 생성했습니다!" 
echo "✅ 42 API 설정을 하려면 아래 링크로 접속하세요."

# 42 API 세팅
echo ""
echo "https://profile.intra.42.fr/oauth/applications"
echo ""



rm -rf env