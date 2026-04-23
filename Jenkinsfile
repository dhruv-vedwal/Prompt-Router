pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "my-docker-registry" // Placeholder
        APP_NAME = "openrouter"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies with Bun...'
                sh 'bun install'
            }
        }

        stage('Backend Tests') {
            steps {
                echo 'Running Vitest in primary-backend...'
                dir('apps/primary-backend') {
                    sh 'bun run test'
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker containers...'
                sh 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying services...'
                // In a local/demo environment, we just restart the containers
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        success {
            echo '✅ Deployment Successful!'
        }
        failure {
            echo '❌ Pipeline Failed. Please check the logs.'
        }
    }
}
