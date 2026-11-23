#!/usr/bin/env bash
# Первичная настройка чистого сервера Ubuntu 24.04 LTS (x86) под tgAssistantBot.
# Запуск от root на сервере (инструкция — «tgAssistantBot — настройка сервера.md» на рабочем столе):
#   bash server-setup.sh [пользователь]          # по умолчанию пользователь deploy
#
# Делает: обновления и автообновления безопасности, пользователь с sudo и вашим SSH-ключом,
# вход только по ключу и без root, файрвол (SSH, HTTP, HTTPS), fail2ban, Docker с compose,
# swap, часовой пояс UTC. Повторный запуск безопасен: уже сделанное пропускается.
set -euo pipefail

DEPLOY_USER="${1:-deploy}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Запустите от root: sudo bash server-setup.sh"
grep -q 'VERSION_ID="24.04"' /etc/os-release || fail "Скрипт рассчитан на Ubuntu 24.04 LTS"
# Без ключа после отключения паролей на сервер будет не зайти — проверяем до любых изменений.
[ -s /root/.ssh/authorized_keys ] || fail "Нет /root/.ssh/authorized_keys: добавьте SSH-ключ при создании сервера"

export DEBIAN_FRONTEND=noninteractive

step "Обновления и базовые пакеты"
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl gnupg ufw fail2ban unattended-upgrades

step "Автоматические обновления безопасности"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

step "Часовой пояс UTC"
timedatectl set-timezone UTC

step "Пользователь ${DEPLOY_USER}"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
	adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG sudo "$DEPLOY_USER"
# sudo без пароля: у пользователя нет пароля, вход только по ключу.
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/90-$DEPLOY_USER"
chmod 440 "/etc/sudoers.d/90-$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /root/.ssh/authorized_keys \
	"/home/$DEPLOY_USER/.ssh/authorized_keys"

step "SSH: только по ключу, без входа root"
cat >/etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
sshd -t || fail "Ошибка в настройках SSH — изменения не применены"
systemctl reload ssh

step "Файрвол: SSH, HTTP, HTTPS"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

step "fail2ban (защита SSH от перебора)"
systemctl enable --now fail2ban

step "Docker"
if ! command -v docker >/dev/null; then
	install -m 0755 -d /etc/apt/keyrings
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
	chmod a+r /etc/apt/keyrings/docker.asc
	codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
	echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $codename stable" >/etc/apt/sources.list.d/docker.list
	apt-get update -q
	apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
usermod -aG docker "$DEPLOY_USER"
# Логи контейнеров не должны заполнить диск.
cat >/etc/docker/daemon.json <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
EOF
systemctl restart docker

step "Swap ${SWAP_SIZE}"
if ! swapon --show | grep -q /swapfile; then
	fallocate -l "$SWAP_SIZE" /swapfile
	chmod 600 /swapfile
	mkswap /swapfile
	swapon /swapfile
	grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

step "Готово"
cat <<EOF
Не закрывайте эту сессию, пока не проверите в НОВОМ окне терминала:
  ssh ${DEPLOY_USER}@<адрес-сервера>
  docker ps
Если вход работает — root по SSH больше не нужен. Дальше — шаги из инструкции.
EOF
