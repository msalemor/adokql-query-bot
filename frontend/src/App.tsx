import { useState } from 'react'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community';
// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridReact } from 'ag-grid-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { IoMdSend } from 'react-icons/io';
import { MdClear } from 'react-icons/md';

const Settings = {
  prompt: "",
  adoquery: "",
  kqlquery: "",
  queryType: "ado",
  organization: "",
  cluster: "",
  database: "",
}

const BASE_URI = "http://localhost:8000/api"
const ADO_URI = `${BASE_URI}/ado`
const KQL_URI = `${BASE_URI}/kql`
const KQLDB_URI = `${BASE_URI}/kqldb`
const COMPLETION_URI = `${BASE_URI}/completion`

interface ServerResponse {
  columns: any[];
  rows: any[];
}

// ADO: Organization: project-name Query: select [System.Id], [System.WorkItemType], [System.Title], [System.AssignedTo], [System.State], [System.Tags], [System.Description] from WorkItems where [System.TeamProject] = 'Project' and [System.ChangedDate] > @today - 180 and [System.WorkItemType] in ('Task') and [System.State] in ('Active') and [System.AreaPath] = 'Path\'
// "select [System.Id], [System.WorkItemType], [System.Title], [System.AssignedTo], [System.State], [System.Tags], [System.Description] from WorkItems where [System.TeamProject] = 'Project' and [System.ChangedDate] > @today - 180 and [System.WorkItemType] in ('Task') and [System.State] in ('Active') and [System.AreaPath] = 'Path\'"
// Cluster: https://help.kusto.windows.net/ Database: SecurityLogs Query: Email | take 10

interface IMessage {
  role: string;
  content: string;
}

function App() {
  //const [count, setCount] = useState(0)

  const [setting, setSettings] = useState(Settings);

  const [kqldb, setKqldb] = useState<string[]>([]);
  const [rowData, setRowData] = useState<any[]>([
  ]);

  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState<ColDef[]>([
  ]);
  const [processing, setProcessing] = useState(false);
  const [lastFailure, setLastFailure] = useState("");
  const [conversation, setConversation] = useState<IMessage[]>([]);


  const reset = () => {
    if (confirm("Are you sure you want to reset?")) {
      const oldSettings = { ...setting };
      oldSettings.adoquery = "";
      oldSettings.kqlquery = "";
      oldSettings.queryType = "ado";
      oldSettings.organization = "";
      oldSettings.cluster = "";
      oldSettings.database = "";
      setSettings(oldSettings);
    }
  }

  const execute = async () => {
    if (!processing) {
      setProcessing(true)
      setLastFailure("")
    } else {
      alert("Please wait for the current operation to finish.");
      return;
    }
    try {
      let uri = "";
      let payload = {}
      if (setting.queryType === "ado") {
        uri = ADO_URI;
        payload = {
          "organization": setting.organization,
          "query": setting.adoquery,
        }
      } else {
        uri = KQL_URI;
        payload = {
          "cluster": setting.cluster,
          "database": setting.database,
          "query": setting.kqlquery,
        }
      }
      const response = await fetch(uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.info(JSON.stringify(response));
        throw new Error("Failed to fetch data from server: " + response.status);
      }
      const data: ServerResponse = await response.json();
      console.log(data);
      if (data) {
        setColDefs(data.columns)
        setRowData(data.rows);
      }
    } catch (error) {
      alert("Error: " + error);
      setLastFailure("" + error);
      console.error(lastFailure);
    }
    finally {
      setProcessing(false);
    }
  }

  const getDatabases = async () => {
    if (!processing) {
      setProcessing(true)
      setLastFailure("")
    } else {
      alert("Please wait for the current operation to finish.");
      return;
    }
    if (!setting.cluster) {
      alert("Please enter a cluster name.");
      return;
    }
    try {
      setLastFailure("")
      const req = {
        "cluster": setting.cluster
      }
      const res = await axios.post<any>(KQLDB_URI, req, {
        headers: {
          "Content-Type": "application/json",
        }
      })
      const data = res.data
      setKqldb(data.databases)
    }
    catch (error) {
      alert(JSON.stringify(error))
      setLastFailure("" + error)
    }
    finally {
      setProcessing(false)
    }
  }

  const completion = async () => {
    if (!processing) {
      setProcessing(true)
      setLastFailure("")
    } else {
      alert("Please wait for the current operation to finish.");
      return;
    }
    try {
      let content = setting.prompt

      if (rowData && content.indexOf("<TJSON>") > -1) {
        const json = JSON.stringify(rowData, null, 2);
        content = content.replace("<TJSON>", json);
      }

      const usrMsg: IMessage = {
        role: "user",
        content
      }
      setConversation((conversation) => [...conversation, usrMsg])

      const req = {
        messages: [...conversation, usrMsg],
        temperature: 0.1
      }
      const resp = await axios.post(COMPLETION_URI, req, {
        headers: {
          "Content-Type": "application/json",
        }
      })
      const data = resp.data.content
      setConversation((conversation) => [...conversation, { role: "assistant", content: data }])
      setSettings({ ...setting, prompt: "" })
    } catch (error) {
      setLastFailure("" + error);
    }
    finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <header className='bg-slate-950 text-white text-2xl font-bold px-2 flex items-center h-[40px]'>
        <span>AI Insights</span>
      </header>
      <div className='flex h-[calc(100vh-40px-35px)]'>
        <div className='flex flex-col w-[65%]'>
          <div className='flex w-full h-[350px]'>
            <div className='flex flex-col p-2 w-full'>
              <p>Query</p>
              {setting.queryType === "ado" &&
                <textarea className='resize-none px-1 h-full' placeholder='Enter your query here'
                  onChange={(e) => setSettings({ ...setting, adoquery: e.target.value })}
                  value={setting.adoquery}
                />
              }
              {setting.queryType === "kql" &&
                <textarea className='resize-none px-1 h-full' placeholder='Enter your query here'
                  onChange={(e) => setSettings({ ...setting, kqlquery: e.target.value })}
                  value={setting.kqlquery}
                />
              }
              <div className='space-x-2'>
                <label htmlFor='ado'>ADO</label><input type="radio" id="ado" name="queryType" value="ado"
                  onChange={(e) => setSettings({ ...setting, queryType: e.target.value })}
                  checked={setting.queryType === "ado"} />
                <label htmlFor='kql'>KQL</label><input type="radio" id="kql" name="queryType" value="kql"
                  onChange={(e) => setSettings({ ...setting, queryType: e.target.value })}
                  checked={setting.queryType === "kql"} />
              </div>
              {setting.queryType === "ado" &&
                <div>
                  <label className='uppercase font-semibold'>Organization</label> <input type="text" placeholder='Organization'
                    onChange={(e) => setSettings({ ...setting, organization: e.target.value })}
                    value={setting.organization}
                  />
                  <br />
                  &nbsp;
                </div>
              }
              {setting.queryType === "kql" &&
                <div className='flex flex-col'>
                  <label className='uppercase font-semibold'>Cluster</label> <input type="text" placeholder='Cluster'
                    onChange={(e) => setSettings({ ...setting, cluster: e.target.value })}
                    value={setting.cluster}
                    onBlur={() => { setKqldb([]); getDatabases(); }}
                  />
                  <label className='uppercase font-semibold'>Database</label>
                  {/*<input type="text" placeholder='Database'
                  onChange={(e) => setSettings({ ...setting, database: e.target.value })}
                  value={setting.database}
                /> */}
                  <select onChange={(e) => setSettings({ ...setting, database: e.target.value })} title='Select a database'>
                    {kqldb.length >= 0 && <option value="">Select a database</option>}
                    {kqldb.map((db, _) => <option key={db} value={db} >{db}</option>)}
                  </select>

                </div>
              }
              <div className='space-x-2 mt-1'>
                <button className='bg-blue-600 text-white px-2 py-1'
                  onClick={execute}
                >Execute</button>
                <button className='bg-orange-600 text-white px-2 py-1'
                  onClick={reset}
                >Reset</button>
              </div>


            </div>
          </div>
          <div className='w-full bg-slate-900 text-white p-1 h-[calc(100vh-425px)]'>
            <AgGridReact
              rowData={rowData}
              columnDefs={colDefs}
              rowHeight={28}
            />
          </div>
        </div>
        <div className='flex flex-col w-[35%]' >
          <div className='h-screen overflow-y-auto flex flex-col p-2 bg-slate-700 text-white space-y-2'>

            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "ml-auto" : "mr-auto"} p-4 w-[90%] rounded-lg ${msg.role === "user" ? "bg-blue-950" : "bg-gray-800"}`}>
                <div>
                  <ReactMarkdown children={msg.content} />
                </div>
              </div>
            ))}

            {/* <div className='ml-auto p-1 rounded-lg bg-slate-800'>user message</div>
            <div className='p-1 rounded-lg bg-gray-800 mr-auto'>assistant message</div> */}
          </div>
          <div className='flex flex-col p-2 bg-slate-800'>
            <p className='text-sm text-white'><strong>Note</strong>: use &lt;TJSON&gt; or &lt;TCSJ&gt; to indicate where to use data in table in your prompt.</p>
            <div className='flex space-x-2 mt-2'>
              <textarea className='w-full resize-none bg-white rounded-md outline-none px-1' rows={7}
                onChange={(e) => setSettings({ ...setting, prompt: e.target.value })}
                value={setting.prompt}
              />
              <div className='flex flex-col justify-center space-y-2'>
                <button className='bg-blue-600 text-white p-1'
                  onClick={completion}
                ><IoMdSend /></button>
                <button className='bg-orange-600 text-white p-1'
                  onClick={() => { setConversation([]); setSettings({ ...setting, prompt: "" }) }}
                ><MdClear /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className='bg-slate-950 text-white px-2 flex items-center h-[35px] space-x-2'>
        {processing &&
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>}
        {lastFailure &&
          <div className='text-red-500 text-sm font-semibold'>{lastFailure}</div>}
        <span>Rows:</span>
        <span className='bg-blue-700 text-white rounded-full px-2 text-sm font-semibold'>{rowData?.length}</span>
      </footer>
    </>
  )
}

export default App
