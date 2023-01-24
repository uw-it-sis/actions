#!/usr/bin/env bash

set -euo pipefail

main() {

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        arg=$1
        shift
        case $arg in
            --collective ) COLLECTIVE=$1 ; shift ;;
            --environment ) ENVIRONMENT=$1 ; shift ;;
            --lambda-function-name ) LAMBDA_FUNCTION_NAME=$1 ; shift ;;
            --artifact-s3-bucket ) ARTIFACT_S3_BUCKET=$1 ; shift ;;
            --artifact-s3-key ) ARTIFACT_S3_KEY=$1 ; shift ;;
            *) fail "Invalid argument: $arg"
        esac
    done

    # Validate arguments
    [[ -z "${COLLECTIVE:-}" ]] && fail "Error: missing argument --collective"
    [[ -z "${ENVIRONMENT:-}" ]] && fail "Error: missing argument --environment"
    [[ -z "${LAMBDA_FUNCTION_NAME:-}" ]] && fail "Error: missing argument --lambda-function-name"
    [[ -z "${ARTIFACT_S3_BUCKET:-}" ]] && fail "Error: missing argument --artifact-s3-bucket"
    [[ -z "${ARTIFACT_S3_KEY:-}" ]] && fail "Error: missing argument --artifact-s3-key"


    # per the terraform definition, the lambda name defaults to the name of the code artifact without the extension
    if [[ "$LAMBDA_FUNCTION_NAME" == "unset" ]]; then
        artifact=$(basename "$ARTIFACT_S3_KEY")
        LAMBDA_FUNCTION_NAME="$COLLECTIVE-$ENVIRONMENT-${artifact%.zip}"
    fi
    echo "Lambda function name: ${LAMBDA_FUNCTION_NAME}"

    echo "Updating function code..."
    updateResponse=$(
        aws lambda update-function-code \
            --publish \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --s3-bucket "$ARTIFACT_S3_BUCKET" \
            --s3-key    "$ARTIFACT_S3_KEY" \
    )
    version=$(echo "$updateResponse" | jq -r .Version)
    echo "Lambda version $version publishing..."

    # Wait until the new version has finished publishing
    state=$(aws lambda get-function \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --qualifier "$version" \
        --query Configuration.State)

    while [[ "$state" = \"Pending\" ]] ; do
        sleep 3

        state=$(aws lambda get-function \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --qualifier "$version" \
            --query Configuration.State)

    done
    echo "Lambda version $version published"

    echo "Pointing lambda alias 'latest' to function version '$version'"
    aws lambda update-alias \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --name latest \
        --function-version "$version"

}

fail() {
    echo >&2 "$@"
    exit 1
}

main "$@"
