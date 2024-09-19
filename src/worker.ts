import { NativeConnection, Worker } from "@temporalio/worker"
import * as activities from './activities'

const {
    TEMPORAL_ADDRESS = 'localhost:7233'
} = process.env

async function main() {
  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS
  })
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'hello-world',
    workflowsPath: require.resolve('./workflows'),
    activities
  })
  await worker.run()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})