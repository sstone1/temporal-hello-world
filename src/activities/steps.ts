export async function completeStep(stepId: string) {
    await fetch(`http://localhost:3002/api/steps/${stepId}/complete`, { method: 'POST' })
}