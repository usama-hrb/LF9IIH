FROM debian:bookworm
RUN apt update && apt install -y git vim zsh curl ca-certificates gnupg
RUN DEBIAN_FRONTEND=noninteractive apt install -y python3 python3-pip python3-venv
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/tarikkudesu/My-configs/refs/heads/main/install.sh)"
WORKDIR /app
# ENTRYPOINT [ "python3", "manage.py", "runserver", "0.0.0.0:8000" ]
ENTRYPOINT [ "tail", "-f" ]