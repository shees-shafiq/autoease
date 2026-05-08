#!/bin/bash
set -euo pipefail

# Run this on a fresh Ubuntu 22.04+ EC2 instance as a sudo-capable user.
# Replace USER_NAME with the Linux username you are using (e.g. ubuntu).
USER_NAME=${USER_NAME:-ubuntu}

echo "==> Updating apt packages"
sudo apt update
sudo apt upgrade -y

echo "==> Installing required packages"
sudo apt install -y ca-certificates curl gnupg lsb-release software-properties-common openjdk-17-jdk git

echo "==> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt update
  sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

echo "==> Adding $USER_NAME to docker group"
sudo usermod -aG docker "$USER_NAME" || true

echo "==> Installing Jenkins"
if ! command -v java >/dev/null 2>&1; then
  echo "Java is not installed; make sure openjdk-17-jdk installed successfully"
fi
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable --now jenkins

echo "==> Bootstrap complete"
echo "Reload your shell or log out/in so docker group membership takes effect"
echo "Then use: sudo systemctl status jenkins"
echo "Visit http://<EC2_PUBLIC_IP>:8080 to complete Jenkins setup"
