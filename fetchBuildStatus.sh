#!/bin/bash

# Pulls the build status of the configured job from Jenkins and writes the JSON output to a file. This file is then 
# provided by Apache and fetched by a custom Javascript in Gerrit (see gerritJenkins.js). The script is triggered every
# 60 seconds (crontab) and thus fetches the build status every 15 seconds.

for i in 1 2 3 4; do
    curl --noproxy '*' -o /var/www/buildstatus.json 'https://USER:API-TOKEN@JENKINS_URL/api/json?tree=lastStableBuild[number],lastUnstableBuild[number],lastFailedBuild[number]' -g || exit 1
    sleep 15
done