pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME        = 'school-frontend'
        IMAGE_NAME      = 'school-frontend:latest'
        FRONTEND_PORT   = '8000'
        DOCKER_NETWORK  = 'jenkins-mysql_default'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/prem21kumars/school-application.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t "$IMAGE_NAME" .'
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    # Stop previous container if running
                    docker rm -f "$APP_NAME" || true

                    # Start new container on the shared Docker network
                    docker run -d \
                        --name "$APP_NAME" \
                        --restart unless-stopped \
                        --network "$DOCKER_NETWORK" \
                        -p "$FRONTEND_PORT:80" \
                        "$IMAGE_NAME"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    sleep 5
                    docker ps --filter "name=$APP_NAME"
                '''
            }
        }
    }

    post {
        success {
            echo 'School Frontend CI/CD completed successfully!'
        }
        failure {
            echo 'Frontend pipeline failed. Check Console Output.'
        }
    }
}
