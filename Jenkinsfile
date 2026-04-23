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
                bat 'bun install'
            }
        }

        stage('Database Setup') {
            steps {
                echo 'Generating Prisma Client...'
                dir('packages/db') {
                    bat 'bunx prisma generate'
                }
            }
        }

        stage('Backend Tests') {
            steps {
                echo 'Running Vitest in primary-backend...'
                dir('apps/primary-backend') {
                    bat 'bun run test'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                echo 'Running Vitest in dashboard-frontend...'
                dir('apps/dashboard-frontend') {
                    bat 'bun run test'
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker containers...'
                bat 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying services...'
                // In a local/demo environment, we just restart the containers
                bat 'docker-compose up -d'
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
