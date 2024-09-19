import { Client, Connection } from "@temporalio/client"
import { randomUUID } from 'node:crypto'
import { cboeKyc } from "./workflows"

const {
  TEMPORAL_ADDRESS = 'localhost:7233'
} = process.env

async function main() {
  const connection = await Connection.connect({
    address: TEMPORAL_ADDRESS
  })
  const client = new Client({
    connection,
  })
  const handle = await client.workflow.start(cboeKyc, {
    taskQueue: 'hello-world',
    args: [{}],
    workflowId: 'workflow-' + randomUUID()
  })
  console.log(await handle.result())
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})