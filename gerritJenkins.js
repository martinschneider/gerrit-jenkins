/* Mark the Gerrit submit button according to the status of a Jenkins Build
 *
 * The build status is determined from the JSON, that Jenkins provides via its API. Since we can not authenticate JSONP
 * calls (and we want the script to work without the user being logged into Jenkins), we provide this JSON on Gerrit.
 * It gets fetched with the following curl command every 15 seconds (using crontab):
 *
 * curl --noproxy '*' -o -g /var/www/buildstatus.json https://user:token@jenkinsUrl/api/json?tree=lastStableBuild[number],lastUnstableBuild[number],lastFailedBuild[number]
 *
 * user      the username of a Jenkins user (make sure the user has read rights for the specified build job)
 * token     the above user's API token
 *
 * /var/www/buildstatus.json needs to be served by Apache (or similar web server) at https://server/buildstatus.json,
 * where server is on the same domain as the Gerrit web interface.
 *
 * Alternatively, you can make the script fetch the JSON from Jenkins directly. In this case you need to use the 
 * Jenkins Secure Requester Whitelist Plugin and whitelist the domain Gerrit runs on (if it is not the same as the one
 * Jenkins uses). Then just use the alternative buildStatusJson value (see comment below). This only works, if a user
 * (with appropriate read rights) is logged into Jenkins (in the same browser) while accessing Gerrit.
 *
 * Due to the timing intervals (15 seconds fetch from Jenkins, 15 seconds fetch from Gerrit) the worst case delay for
 * this script to display a change in the build status is 30 seconds. This could be reduced to about 15 seconds, if we
 * manage to fetch the build status from Gerrit right after it gets pulled from Jenkins.
 *
 * @author Martin Schneider
 */

$(document).ready(function()
{
  /* Jenkins job to monitor */
  /*buildStatusJson = "https://" + username + ":" + apiToken + "@" + jenkinsUrl + "/api/json?tree=lastStableBuild[number],lastUnstableBuild[number],lastFailedBuild[number]&jsonp=?"; */
  buildStatusJson = "https://server/buildstatus.json"; /* the URL to the build server status, must be on the same domain as Gerrit */

  /* Gerrit project and branch */
  project = "test";
  branch = "master";

  /* time between each check of the build status (in milliseconds) */
  jenkinsDelay = 15000;

  /* time between each DOM manipulation (in milliseconds) */
  ajaxDelay = 1000;

  /* selector to identify the project of a change */
  projectSelector = "table.infoBlock.changeInfoBlock td:contains('Project')";
  branchSelector = "table.infoBlock.changeInfoBlock td:contains('Branch')";

  /* selector to find the submit buttons (obviously does not support i18n yet) */
  submitButtonSelector = "button:contains('Submit')";

  /* messages to display as a tooltip */
  stableMessage = "BUILD IS STABLE! You can submit your change.";
  failedMessage = "BUILD IS BROKEN! Do NOT submit this change unless its purpose is to fix the build.";
  unstableMessage = "BUILD IS UNSTABLE! Do NOT submit this change unless its purpose is to fix the build.";
  unknownMessage = "BUILD STATUS IS UNKNOWN! Please check manually before you submit this change.";

  /* styling */
  stableColor = "green";
  unstableColor = "red";
  failColor = "red";
  unknownColor = "grey";
  borderWidth = "4px";

  UNKNOWN = -1;
  STABLE = 0;
  UNSTABLE = 1;
  FAIL = 2;

  status = UNKNOWN;

  /* initially load build status */
  loadBuildStatus();

  /* schedule reloading of build status */
  setInterval(function(){
    loadBuildStatus();
  }, jenkinsDelay);
  
  /* schedule DOM manipulation */
  setInterval(function(){
    // check if the current change affects the specified project and branch
    if ($(projectSelector).next().text().trim()==project && $(branchSelector).next().text().trim()==branch)
    {
      markButton(status);
    }
  },ajaxDelay);
});

function getBuildNumber(object)
{
  if (object == null)
  {
    return 0;
  }
  return object.number;
}

/* load the build status from Jenkins via JSONP */
function loadBuildStatus()
{
  $.getJSON(buildStatusJson)
  .done(function(data)
  {
    latestSuccess = getBuildNumber(data.lastStableBuild);
    latestFail = getBuildNumber(data.lastFailedBuild);
    latestUnstable = getBuildNumber(data.lastUnstableBuild);
    if (latestFail > latestSuccess && latestFail > latestUnstable)
    {
      status = FAIL;
      console.log("Retrieved build status from Jenkins: FAILURE");
    }
    else if (latestUnstable > latestSuccess && latestUnstable > latestFail)
    {
      status = UNSTABLE;
      console.log("Retrieved build status from Jenkins: UNSTABLE");
    }
    else if (latestSuccess > latestFail && latestSuccess > latestUnstable)
    {
      status = STABLE;
      console.log("Retrieved build status from Jenkins: STABLE");
    }
    else
    {
      status = UNKNOWN;
      console.log("Could not determine build status.");
    }
  })
  .fail(function(jqxhr, textStatus, error)
  {
    status = UNKNOWN;
    console.log("Could not retrieve build status from Jenkins: " + error);
  });
}

/* mark the submit button according to the build status */
function markButton(status)
{
  if (status==STABLE)
  {
    $(submitButtonSelector).css("border-color", stableColor).css("border-width", borderWidth).css("cursor", "pointer").attr("title", stableMessage);
  }
  else if (status==FAIL)
  {
    $(submitButtonSelector).css("border-color", failColor).css("border-width", borderWidth).css("cursor", "not-allowed").attr("title", failedMessage);
  }
  else if (status==UNSTABLE)
  {
    $(submitButtonSelector).css("border-color", unstableColor).css("border-width", borderWidth).css("cursor", "not-allowed").attr("title", unstableMessage);
  }
  else
  {
    $(submitButtonSelector).css("border-color", unknownColor).css("border-width", borderWidth).css("cursor", "help").attr("title", unknownMessage);
  }
}
