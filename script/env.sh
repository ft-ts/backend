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
echo ".env 파일을 생성했습니다!"

rm -rf env