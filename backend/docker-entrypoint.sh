#!/bin/bash

# Script de démarrage automatisé pour Docker avec tunnels intégrés
echo "🚀 Démarrage AREA avec tunnels automatiques..."

# Fonction pour démarrer ngrok en arrière-plan si activé
start_ngrok_if_enabled() {
    if [ "$ENABLE_TUNNELS" = "true" ]; then
        echo "🔗 Démarrage des tunnels ngrok..."
        
        # Vérifier si ngrok est disponible
        if [ -f "/usr/local/bin/ngrok" ]; then
            # Créer la configuration ngrok
            mkdir -p /root/.config/ngrok
            cat > /root/.config/ngrok/ngrok.yml << EOF
version: "2"
authtoken: ${NGROK_AUTHTOKEN:-}
tunnels:
  backend:
    proto: http
    addr: localhost:8080
  frontend:
    proto: http
    addr: localhost:8081
web_addr: 0.0.0.0:4040
EOF

            # Démarrer ngrok en arrière-plan
            nohup /usr/local/bin/ngrok start --all --config /root/.config/ngrok/ngrok.yml > /tmp/ngrok.log 2>&1 &
            echo "✅ Tunnels ngrok démarrés en arrière-plan"
            
            # Attendre un peu que ngrok se lance
            sleep 5
            
        else
            echo "⚠️  Ngrok non trouvé, tunnels désactivés"
        fi
    else
        echo "ℹ️  Tunnels désactivés (ENABLE_TUNNELS=${ENABLE_TUNNELS})"
    fi
}

# Démarrer ngrok si nécessaire
start_ngrok_if_enabled

# Démarrer l'application principale
echo "🎯 Démarrage de l'application NestJS..."
exec "$@"
