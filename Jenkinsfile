pipeline {
    agent any

    environment {
        // -------------------------------------------------------
        // Updated with your EC2 Public IP
        // -------------------------------------------------------
        APP_URL          = 'http://51.21.3.171:3000'
        DOCKER_IMAGE_TAG = "autoease-tests:${BUILD_NUMBER}"

        // Email settings — Jenkins SMTP must be configured
        MAIL_FROM        = 'jenkins@autoease.com'
    }

    stages {

        // ----------------------------------------------------------
        // 1. Checkout source code from GitHub
        // ----------------------------------------------------------
        stage('Checkout') {
            steps {
                echo "Checking out repository..."
                checkout scm
            }
        }

        // ----------------------------------------------------------
        // 2. Start the application with Docker Compose
        // ----------------------------------------------------------
        stage('Deploy Application') {
            steps {
                echo 'Starting AutoEase application...'
                // Use the hyphenated command that we confirmed works on your EC2
                sh 'docker-compose down || true'
                sh 'docker-compose up -d --build'
                echo 'Waiting for services to be ready...'
                sleep 20
            }
        }

        // ----------------------------------------------------------
        // 3. Build the Selenium test Docker image
        // ----------------------------------------------------------
        stage('Build Test Image') {
            steps {
                echo "Building Selenium test container..."
                sh "docker build -f Dockerfile.tests -t ${DOCKER_IMAGE_TAG} ."
            }
        }

        // ----------------------------------------------------------
        // 4. Run Selenium tests inside the container
        // ----------------------------------------------------------
        stage('Run Tests') {
            steps {
                echo "Running Selenium tests against ${APP_URL} ..."
                sh """
                    docker run --rm \
                        --network host \
                        -e APP_URL=${APP_URL} \
                        -v \$(pwd)/test-results:/app/target/surefire-reports \
                        ${DOCKER_IMAGE_TAG} \
                        mvn test -Dapp.url=${APP_URL}
                """
            }
            post {
                always {
                    // Archive JUnit XML results so Jenkins can render them
                    junit allowEmptyResults: true,
                          testResults: 'test-results/*.xml'
                }
            }
        }

        // ----------------------------------------------------------
        // 5. Tear down the application containers
        // ----------------------------------------------------------
        stage('Teardown') {
            steps {
                echo 'Cleaning up containers...'
                sh 'docker-compose down'
            }
        }
    }

    // ----------------------------------------------------------
    // Post-pipeline: email results to the person who pushed
    // ----------------------------------------------------------
    post {
        always {
            script {
                // Get the email of whoever triggered this build via a git push
                def committerEmail = sh(
                    script: "git log -1 --format='%ae'",
                    returnStdout: true
                ).trim()

                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
                def subject     = "[AutoEase CI] Build #${BUILD_NUMBER} — ${buildStatus}"
                def body        = """
AutoEase Jenkins Pipeline Report
=================================
Build #     : ${BUILD_NUMBER}
Status      : ${buildStatus}
Branch      : ${GIT_BRANCH}
Commit      : ${GIT_COMMIT}
App URL     : ${APP_URL}
Build URL   : ${BUILD_URL}

Test Results
------------
${buildStatus == 'SUCCESS' ? 'All tests PASSED ✅' : 'One or more tests FAILED ❌'}

See full test report: ${BUILD_URL}testReport/

This email was sent automatically by the Jenkins pipeline.
"""
                emailext(
                    subject:     subject,
                    body:        body,
                    to:          committerEmail,
                    from:        MAIL_FROM,
                    replyTo:     MAIL_FROM,
                    attachmentsPattern: 'test-results/*.xml'
                )
                echo "Test result email sent to: ${committerEmail}"
            }
        }
    }
}
