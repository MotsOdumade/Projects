
// functions defined here will be used in index.js
// database credentials are specified in a .env file stored within the same package on the remote machine
// check authorised() for an example of how to query the database and process the results

const dataChartDict = {
      'project-completeness-breakdown': 'speedometer',
      'deadlines-met-last-7-days': 'progress bar',
      'task-status-breakdown': 'pie',
      'member-projects': 'list'
};

const listDataAbout = ['project', 'avg-project'];


const mysql = require('mysql');
require('dotenv').config();

function execute_sql_query(sql_query){
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
            return false; // handle error appropriately
        }
        // Execute a query
        console.log('Connected to the database');
        connection.query(sql_query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                connection.end(); // Close the connection if there's an error
                return false; 
            }
            // access result
              
            // Map each row to a plain JavaScript object
            const formattedResults = results.map(row => {
                  
                const formattedRow = {};
                for (const key in row) {
                  formattedRow[key] = row[key];
                }
                return formattedRow;
              });

            // Log the formatted results
              console.log(formattedResults);

              // Close the connection
              connection.end();
              return formattedResults;
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
      execute_sql_query("SELECT * FROM EmployeeTable;");
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
    'whole-project': {'deadline': 'idk the date format', 'completed-tasks': 10, 'incomplete-tasks': 4, 'percentage-complete': 71.4},
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

function task_status_breakdown_request(dataAbout, targetId, when){
  const title = 'Breakdown of Task Progress Status';
  
  let sampleData = {
        labels: ['Whole Project', 'Employee 1', 'Employee 2', 'Employee 3'], // Example employee names
        datasets: [{
          label: 'In Progress Tasks',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          data: [10, 5, 8, 6] // Example number of in-progress tasks for each entity
        }, {
          label: 'Completed Tasks',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          data: [20, 10, 15, 12] // Example number of completed tasks for each entity
        }, {
          label: 'Not Started',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          data: [20, 10, 15, 12] // Example number of completed tasks for each entity
        }]
};
  return {'title': title, 'sampleData': sampleData};
}



function member_projects_request(targetId){
  // returns a list of objects representing the projects that the individual is currently in
  const title = 'Projects Involved In';
  let sampleData = [];
  // query the database
  
  sampleData = [
    {'project-id': '1201', 'project-name': 'Skill Swap Initiative'},
    {'project-id': '1205', 'project-name': 'Office Connect Project'},
    {'project-id': '1202', 'project-name': 'Corporate Social Responsibility Campaign'},
    {'project-id': '1204', 'project-name': 'Employee Training and Development Initiative'},
    {'project-id': '1209', 'project-name': 'Customer Experience Enhancement Project'},
    {'project-id': '1207', 'project-name': 'Performance Management System Upgrade'},
    {'project-id': '1200', 'project-name': 'Risk Management and Compliance Review'},
  ];
  
  return {'title': title, 'sampleData': sampleData};
}


module.exports = {valid_request,
                  authorised,
                  data_to_chart,
                  project_completeness_breakdown_request,
                  deadlines_met_last_7_days_request,
                  task_status_breakdown_request,
                  member_projects_request};
