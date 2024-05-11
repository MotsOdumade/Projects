
// import functions from helpers.js
const {
      valid_request,
      authorised,
      data_to_chart,
      project_completeness_breakdown_request,
      deadlines_met_last_7_days_request,
      task_status_breakdown_request,
      member_projects_request
      
} = require('./helpers');

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const app = express();
// HTTP server
const httpServer = http.createServer(app);
const HTTP_PORT = 3002;


// Define your Express routes here
// ------ handle GET requests to /v1/project-analytics -----------------------

app.get('/v1.1/data-analytics/project-analytics', (req, res) => {
      
       // clean query parameters
        const dataRequested = (req.query.data || '').trim().replace(/<[^>]*>/g, '');
        const accessCode = (req.query['access-code'] || '').trim().replace(/<[^>]*>/g, '');
        const dataAbout = (req.query['data-about'] || '').trim().replace(/<[^>]*>/g, '');
        const targetId = (req.query['target-id'] || '').trim().replace(/<[^>]*>/g, '');
        const when = (req.query.when || '').trim().replace(/<[^>]*>/g, '');

      // prepare the response object
      // ensure you're using a uniform interface!
      const responseObj = {
            'cacheable' : false,
            'valid-request': false,
            'authorised' : false,
            'display-as' : '',
            'suggested-title' : '',
            'description' : 'description of analytics-data',
            'analytics-data' : []
      };


      // check validity of request (check if all data required for the request has been given)
      if (valid_request(dataRequested, accessCode, dataAbout, targetId) === false){
            // missing data or wrong keywords specified in the request
            return res.json(responseObj);
      } else {
            // update the response object
            responseObj['valid-request'] = true;
      }
      


      // check authorisation
      if (authorised(accessCode) === false){
            // unauthorised data access
            return res.json(responseObj);
      } else {
            responseObj['authorised'] = true;
            // update response object with expected chart type
            const displayType = data_to_chart(dataRequested);
            responseObj['display-as'] = displayType;
      }
      
      // they're authorised - carry out the request
      switch (dataRequested) {
            case "task-status-breakdown":
                  // a bar chart showing proportion of current tasks that are in progress, not started or completed
                  task_status_breakdown_request(targetId)
                      .then(taskStatusObj => {
                          responseObj['suggested-title'] = taskStatusObj['title'];
                          responseObj['analytics-data'] = taskStatusObj['sampleData'];
                          res.json(responseObj);
                      })
                      .catch(error => {
                          console.error('Error fetching task status breakdown:', error);
                          // Handle the error here
                          res.status(500).json({ error: 'Internal server error' });
                      });
                  break;
            case "deadlines-met-last-7-days":
                  // a progress-bar showing the proportion of deadlines that the individual has met in the last 7 days
                  const deadlinesMetObj = deadlines_met_last_7_days_request(dataAbout, targetId, when);
                  responseObj['suggested-title'] = deadlinesMetObj['title'];
                  responseObj['analytics-data'] = deadlinesMetObj['sampleData'];
                  break;
            case "project-completeness-breakdown":
                  // a line chart showing the (weighted) task completion over time (by week)
                  const projectCompletionObj = project_completeness_breakdown_request(dataAbout, targetId, when);
                  responseObj['suggested-title'] = projectCompletionObj['title'];
                  responseObj['analytics-data'] = projectCompletionObj['sampleData'];
                  break;
            case "member-projects":
                  // a line chart showing the (weighted) task completion over time (by week)
                  const memberProjectsObj = member_projects_request(targetId);
                  responseObj['suggested-title'] = memberProjectsObj['title'];
                  responseObj['analytics-data'] = memberProjectsObj['sampleData'];
                  break;
        
  
        default:
                  // indicates a request option that hasn't yet been implemented
                  
         
      }
      
      

        return res.json(responseObj);

});

httpServer.listen(HTTP_PORT, () => {
    console.log(`Project-analytics API is running on port ${HTTP_PORT}`);
});
