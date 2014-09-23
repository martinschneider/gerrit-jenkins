gerrit-jenkins
==============

Gerrit customization to retrieve the build status from Jenkins and mark the "Submit" buttons accordingly

Usage:
* put gerritJenkins.js and jquery-2.1.1.min.js into $site_path/static, e.g.: /srv/gerrit/site/static (alternatively adapt GerritSiteFooter.html and load jquery from a CDN, e.g. https://code.jquery.com/jquery-2.1.1.min.js)
* put GerritSiteFooter.html in $site_path/etc, e.g.: /etc/gerrit
* add crontab entries for fetchBuildStatus.sh:

`* * * * * /etc/gerrit/fetchBuildStatus.sh >/dev/null 2>&1`

Also see http://gerrit.googlecode.com/svn/documentation/2.1/config-headerfooter.html

Tested with Jenkins 1.554.3 and Gerrit 2.8.2.
