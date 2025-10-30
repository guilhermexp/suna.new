#!/bin/bash

# Development Docker Compose Helper Script
# Usage: ./dev.sh [command]

set -e

COMPOSE_FILE="docker-compose.dev.yaml"

case "${1:-up}" in
  up)
    echo "🚀 Starting development environment with hot reload..."
    docker compose -f $COMPOSE_FILE up --build
    ;;

  down)
    echo "🛑 Stopping development environment..."
    docker compose -f $COMPOSE_FILE down
    ;;

  restart)
    echo "🔄 Restarting development environment..."
    docker compose -f $COMPOSE_FILE restart
    ;;

  logs)
    SERVICE=${2:-}
    if [ -z "$SERVICE" ]; then
      echo "📋 Showing logs for all services..."
      docker compose -f $COMPOSE_FILE logs -f
    else
      echo "📋 Showing logs for $SERVICE..."
      docker compose -f $COMPOSE_FILE logs -f $SERVICE
    fi
    ;;

  backend)
    echo "🐍 Starting backend only..."
    docker compose -f $COMPOSE_FILE up --build backend worker redis
    ;;

  frontend)
    echo "⚛️  Starting frontend only..."
    docker compose -f $COMPOSE_FILE up --build frontend
    ;;

  rebuild)
    echo "🔨 Rebuilding images..."
    docker compose -f $COMPOSE_FILE build --no-cache
    ;;

  clean)
    echo "🧹 Cleaning up containers, volumes, and images..."
    docker compose -f $COMPOSE_FILE down -v --remove-orphans
    docker compose -f $COMPOSE_FILE rm -f
    ;;

  shell-backend)
    echo "🐚 Opening shell in backend container..."
    docker compose -f $COMPOSE_FILE exec backend sh
    ;;

  shell-frontend)
    echo "🐚 Opening shell in frontend container..."
    docker compose -f $COMPOSE_FILE exec frontend sh
    ;;

  *)
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up              - Start all services with hot reload (default)"
    echo "  down            - Stop all services"
    echo "  restart         - Restart all services"
    echo "  logs [service]  - Show logs (optionally for specific service)"
    echo "  backend         - Start only backend services"
    echo "  frontend        - Start only frontend service"
    echo "  rebuild         - Rebuild all images from scratch"
    echo "  clean           - Remove all containers, volumes, and orphans"
    echo "  shell-backend   - Open shell in backend container"
    echo "  shell-frontend  - Open shell in frontend container"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh up              # Start everything"
    echo "  ./dev.sh logs backend    # Show backend logs"
    echo "  ./dev.sh backend         # Run only backend"
    exit 1
    ;;
esac
