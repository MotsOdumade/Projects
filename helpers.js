
// functions defined here will be used in index.js
// database credentials are specified in a .env file stored within the same package on the remote machine
// check authorised() for an example of how to query the database and process the results

const dataChartDict = {
      'project-completeness-breakdown': 'speedometer',
      'deadlines-met-last-7-days': 'progress bar',
      'task-status-breakdown': 'bar',
      'member-projects': 'list',
      'performance-metric': 'bar'
};

const listDataAbout = ['project', 'avg-project'];


const mysql = require('mysql');
require('dotenv').config();

function execute_sql_query(sql_query) {
    return new Promise((resolve, reject) => {
        // Create a connection to the database using environment variables
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        });

        // Connect to the database
        connection.connect((err) => {
            if (err) {
                console.error('Error connecting to the database:', err);
                reject(err);
                return;
            }
            // Execute a query
            console.log('Connected to the database');
            connection.query(sql_query, (err, results) => {
                // Close the connection
                connection.end();
                if (err) {
                    console.error('Error executing query:', err);
                    reject(err);
                    return;
                }
                // Map each row to a plain JavaScript object
                const formattedResults = results.map(row => {
                    const formattedRow = {};
                    for (const key in row) {
                        formattedRow[key] = row[key];
                    }
                    return formattedRow;
                });
                // Resolve the promise with the formatted results
                resolve(formattedResults);
            });
        });
    });
}



function valid_request(data_requested, access_code, data_about, target_id){
      // check if the request is missing necessary information
  if (Object.keys(dataChartDict).includes(data_requested) === false){
        return false;
  }
  if (access_code == ''){
        return false;
  }
  if (listDataAbout.includes(data_about) === false){
        return false;
  }
  if (data_about == 'avg-project'){
        return true;
  } 
  if (target_id == ''){
        return false;
  }
  
  if (isNaN(target_id)){
        // it's not a number
        return false;
  }
  return true;
}


function authorised(access_code) {
    // verify the access code provided
    if (access_code == process.env.ACCESS_CODE){
      // correct access code for company-analytics code 
      
      return true;
    } 
    // else incorrect access_code 
    return false;
    
}


function data_to_chart(data_requested){
  
  // -- matches dataRequest to a chart type - probably unnecessary
  const chart = dataChartDict[data_requested];
  return chart;
}

// ---- functions to execute requests

function project_completeness_breakdown_request(dataAbout, targetId, when){
  const title = 'Breakdown of the Complete and Incomplete Tasks';
  let sampleData = {
    'whole-project': {'deadline': '', 'completed-tasks': 10, 'incomplete-tasks': 4, 'percentage-complete': 71.4},
    'employee-breakdown': [{'name': 'John', 'completed-tasks': 4, 'incomplete-tasks': 1, 'percentage-complete': 80.0},
                          {'name': 'Jane', 'completed-tasks': 3, 'incomplete-tasks': 0, 'percentage-complete': 100.0},
                          {'name': 'Jen', 'completed-tasks': 2, 'incomplete-tasks': 2, 'percentage-complete': 50.0},
                          {'name': 'Jim', 'completed-tasks': 1, 'incomplete-tasks': 1, 'percentage-complete': 50.0}] 
    };

  return {'title': title, 'sampleData': sampleData};
}




function deadlines_met_last_7_days_request(dataAbout, targetId, when){
  const title = 'Breakdown of Project Deadlines Met in the Last 7 Days';
  let sampleData = {
    'whole-project': {'total-tasks': 14, 'deadlines-met': 6, 'percentage-complete': 71.4},
    'employee-breakdown': [{'name': 'John', 'total-tasks': 5, 'deadlines-met': 3, 'percentage-complete': 42.9},
                          {'name': 'Jane', 'total-tasks': 3, 'deadlines-met': 0, 'percentage-complete': 0.0},
                          {'name': 'Jen', 'total-tasks': 4, 'deadlines-met': 2, 'percentage-complete': 50.0},
                          {'name': 'Jim', 'total-tasks': 2, 'deadlines-met': 1, 'percentage-complete': 50.0}] 
    };

  return {'title': title, 'sampleData': sampleData};
}

async function task_status_breakdown_request(targetId) {
  const title = 'Breakdown of Task Progress Status';
  const membersQuery = `SELECT DISTINCT first_name, user.id 
        FROM task 
        INNER JOIN user 
        ON task.assigned_user_id = user.id 
        WHERE project_id = ${targetId};`;
  let sampleData = {
    labels: ['Whole Project'],
    datasets: [{
      label: 'Not Started',
      backgroundColor: 'rgba(255, 174, 71, 0.5)',
      data: []
    },{
      label: 'In Progress Tasks',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      data: []
    }, {
      label: 'Completed Tasks',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      data: []
    }]
  };

  try {
    let queryData1 = await execute_sql_query(membersQuery);
    let userIds = [];
    let query_not_started = `SELECT COUNT(*) AS Tasks
      FROM task 
      LEFT JOIN task_start ON task.id = task_start.task_id 
      WHERE task_start.task_id IS NULL AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND task.project_id =${targetId}`;
    let query_in_progress = `SELECT COUNT(*) AS Tasks
      FROM task 
      INNER JOIN task_start ON task.id = task_start.task_id 
      LEFT JOIN task_complete ON task.id = task_complete.task_id   
      WHERE task_complete.task_id IS NULL AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND task.project_id =${targetId}`;
    let query_completed = `SELECT COUNT(*) AS Tasks
      FROM task 
      INNER JOIN task_complete ON task.id = task_complete.task_id 
      WHERE task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND task.project_id = ${targetId}`;

    for (let i = 0; i < queryData1.length; i++) {
      sampleData['labels'].push(queryData1[i]["first_name"]);
      userIds.push(queryData1[i]["id"]);
    }
      

    for (let i = 0; i < userIds.length; i++) {
      let extraQuery1 = ` UNION ALL SELECT COUNT(*) 
            FROM task 
            LEFT JOIN task_start ON task.id = task_start.task_id 
            WHERE task_start.task_id IS NULL 
            AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') 
            AND task.project_id =${targetId} 
            AND assigned_user_id = ${userIds[i]}`;
      query_not_started += extraQuery1;
      let extraQuery2 = ` UNION ALL SELECT COUNT(*) 
            FROM task 
            INNER JOIN task_start 
            ON task.id = task_start.task_id 
            LEFT JOIN task_complete 
            ON task.id = task_complete.task_id   
            WHERE task_complete.task_id IS 
            NULL AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') 
            AND task.project_id =${targetId} 
            AND assigned_user_id = ${userIds[i]}`;
      query_in_progress += extraQuery2;
      let extraQuery3 = ` UNION ALL SELECT COUNT(*) 
            FROM task 
            INNER JOIN task_complete 
            ON task.id = task_complete.task_id 
            WHERE task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') 
            AND task.project_id = ${targetId} 
            AND assigned_user_id = ${userIds[i]}`;
      query_completed += extraQuery3;
    }

    query_not_started += ";";
    query_in_progress += ";";
    query_completed += ";";

    let queryData2 = await execute_sql_query(query_not_started);
    let queryData3 = await execute_sql_query(query_in_progress);
    let queryData4 = await execute_sql_query(query_completed);
    
    for (let i = 0; i < queryData2.length; i++) {
      sampleData['datasets'][0]['data'].push(queryData2[i]["Tasks"]);
    }
    for (let i = 0; i < queryData3.length; i++) {
      sampleData['datasets'][1]['data'].push(queryData3[i]["Tasks"]);
    }
    for (let i = 0; i < queryData4.length; i++) {
      sampleData['datasets'][2]['data'].push(queryData4[i]["Tasks"]);
    }

    return {'title': title, 'sampleData': sampleData};
  } catch (error) {
    console.error('Error executing SQL query:', error);
    return { error: 'Internal server error' };
  }
}


async function member_projects_request(targetId){
  // returns a list of objects representing the projects that the individual is currently in
  const title = 'Projects Leading';
  let sampleData;
  // query the database
  let query_all_projects = `SELECT name as 'project-name', id as 'project-id' FROM project;`;
  let query_projects_leading = `SELECT name as 'project-name', id as 'project-id' FROM project WHERE lead_id = ${targetId};`;
  let roleQuery = `SELECT COUNT(*) as count FROM user WHERE role LIKE "Manager" AND id = ${targetId};`; 
  let query2;
try {
    // query the database
    let roleQueryData = await execute_sql_query(roleQuery);
      console.log("manaher?", roleQueryData[0]['count'] );
    if (roleQueryData[0]['count'] == 0){
      // not a manager
      query2 = query_projects_leading;
    } else { // maybe a leader
      query2 = query_all_projects;
    }
    
    try {
          // query the database
          let queryData2 = await execute_sql_query(query2);
          sampleData = queryData2;
          return {'title': title, 'sampleData': sampleData};
        } catch (error) {
          console.error('Error executing SQL query:', error);
          // Handle the error here
        }
          
      } catch (error) {
          console.error('Error executing SQL query:', error);
          // Handle the error here
      }
  
  
  return {'title': title, 'sampleData': sampleData};
}

function sample_performance_metric(targetId){
      const title = 'Breakdown of Performance';
      let outputData = {};
      switch (targetId){
            case 1:
                  outputData["1"]  = {
                      labels: ['Total Weight of Tasks Completed'],
                      datasets: [{
                        label: 'Project Members',
                        backgroundColor: 'rgba(54, 160, 201, 0.5)',
                        data: [11]
                      },{
                        label: 'Current User',
                        backgroundColor: 'rgba(240, 134, 134, 0.5)',
                        data: [1]
                      }]
                    };
                  outputData["2"]  = {
                      labels: ['Total Weight of Tasks Completed'],
                      datasets: [{
                        label: 'Project Members',
                        backgroundColor: 'rgba(54, 160, 201, 0.5)',
                        data: [6]
                      },{
                        label: 'Current User',
                        backgroundColor: 'rgba(240, 134, 134, 0.5)',
                        data: [0]
                      }]
                    };
                  outputData["3"]  = 
                        {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [1]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [6]
                            }]
                          };
                  outputData["5"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [19]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [5]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 2:
                  outputData["1"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [11]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [5]
                            }]
                          };
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["5"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [19]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [4]
                            }]
                          };
                  outputData["6"]  = 
                        {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [6]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 3:
                  outputData["1"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [11]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [5]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 4:
                  outputData["1"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [11]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["2"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [6]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [4]
                            }]
                          };
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [6]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [1]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 5:
                  outputData["1"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [11]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["2"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [6]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [2]
                            }]
                          };
                  outputData["5"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [19]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [5]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };

                   return {'title': title, 'sampleData': outputData};
                  break;
            case 6:
                  outputData["2"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [6]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["3"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [1]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [1]
                            }]
                          };
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [6]
                            }]
                          };
                  outputData["5"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [19]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [5]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 7:
                  outputData["1"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [11]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["5"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [19]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 8:
                  outputData["1"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [11]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["5"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [19]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 9:
                  outputData["2"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [6]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 10:
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 11:
                  outputData["2"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [6]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["3"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [1]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 12:
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 13:
                  outputData["3"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [1]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 14:
                  outputData["3"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [1]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            case 15:
                  outputData["1"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [11]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["2"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [6]
                            }]
                          };
                  outputData["3"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [1]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["4"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [18]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["5"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [19]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                  outputData["6"]  = {
                            labels: ['Total Weight of Tasks Completed'],
                            datasets: [{
                              label: 'Project Members',
                              backgroundColor: 'rgba(54, 160, 201, 0.5)',
                              data: [7]
                            },{
                              label: 'Current User',
                              backgroundColor: 'rgba(240, 134, 134, 0.5)',
                              data: [0]
                            }]
                          };
                   return {'title': title, 'sampleData': outputData};
                  break;
            default:
                  console.log("none of the cases matched");
                  return {'title': title, 'sampleData': outputData};
                  break;
      }






      
     

      
}

async function performance_metric_request(targetId) {
  const title = 'Breakdown of Performance';
  let projects_query = `SELECT p.id, p.name 
      FROM project_team_member ptm 
      JOIN project p ON ptm.project_id = p.id 
      WHERE ptm.user_id = ${targetId}`;
  let sql_query_2 = ``;
  let sql_query_3 = ``;
  let outputData = {};
  let sampleData = {
    labels: ['Total Weight of Tasks Completed'],
    datasets: [{
      label: 'Average Project Member',
      backgroundColor: 'rgba(54, 160, 201, 0.5)',
      data: []
    },{
      label: 'Current User',
      backgroundColor: 'rgba(240, 134, 134, 0.5)',
      data: []
    }]
  };
  try {
        projQueryData = await execute_sql_query(projects_query);
        if (projQueryData.length > 0){
              sql_query_2 += `SELECT SUM(t.weight) AS average_weight, t.project_id   
              FROM task_complete tc   
              INNER JOIN task t ON tc.task_id = t.id   
              WHERE t.project_id = ${projQueryData[0]["id"]}
              AND complete_date > DATE_SUB(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s'), INTERVAL 1 WEEK)`;
              
              sql_query_3 += `SELECT SUM(t.weight) AS average_weight, t.project_id   
              FROM task_complete tc   
              INNER JOIN task t ON tc.task_id = t.id   
              WHERE t.project_id = ${projQueryData[0]["id"]}
              AND complete_date > DATE_SUB(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s'), INTERVAL 1 WEEK) 
              AND t.assigned_user_id = ${targetId}`;
        
              for (let j = 1; j < projQueryData.length; j++){
                    sql_query_2 += ` UNION ALL SELECT SUM(t.weight) 
                    AS average_weight, t.project_id   
                    FROM task_complete tc   
                    INNER JOIN task t ON tc.task_id = t.id   
                    WHERE t.project_id = ${projQueryData[j]["id"]}
                    AND complete_date > DATE_SUB(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s'), INTERVAL 1 WEEK)`;
                    sql_query_3 += ` UNION ALL SELECT SUM(t.weight) 
                    AS average_weight, t.project_id   
                    FROM task_complete tc   
                    INNER JOIN task t ON tc.task_id = t.id   
                    WHERE t.project_id = ${projQueryData[j]["id"]}
                    AND complete_date > DATE_SUB(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s'), INTERVAL 1 WEEK) 
                    AND t.assigned_user_id = ${targetId}`;
              }
             

        }
        sql_query_2 += ";";
        sql_query_3 += ";";
        
        
        //console.log("query 2 :", sql_query_2);
        //console.log("query 3 :", sql_query_3);
        try {
            
                let queryData2 = await execute_sql_query(sql_query_2);
              
                let queryData3 = await execute_sql_query(sql_query_3);
              let newData = sampleData;
                for (let i = 0; i < queryData3.length; i++){
                      newData = sampleData;
                      newData["datasets"][0]["data"].push(queryData3[i]["average_weight"]);
                      newData["datasets"][1]["data"].push(queryData2[i]["average_weight"]);
                      outputData[queryData2[i]["project_id"]] = newData;
                }
                 return {'title': title, 'sampleData': outputData};
                   
                
              } catch (error) {
                console.error('Error executing SQL query:', error);
                return { error: 'Internal server error' };
              }
  } catch (error) {console.error('Error executing SQL query:', error);
    return { error: 'Internal server error' };}

      
  
}

module.exports = {valid_request,
                  authorised,
                  data_to_chart,
                  project_completeness_breakdown_request,
                  deadlines_met_last_7_days_request,
                  task_status_breakdown_request,
                  member_projects_request,
                  sample_performance_metric,
                 performance_metric_request};
