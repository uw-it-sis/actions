# Deploy UI Code
Deploys the UI artifact into the CDN

This action takes the UI code artifact out of the artifacts bucket, and writes it to the correct location in the CDN S3
bucket to be served as the UI. Then the cloudfront cache is invalidated, so that the updated code can be cached and
served.

The script for this is based on the script from our [terraform-modules deploy_ui_code
module](https://github.com/uw-it-sis/terraform-modules/tree/master/deploy_ui_code). It is the same script with some
slight modifications to work better in this context.

This action was only designed to work in the dev environment, so probably won't work correctly in other environments.
