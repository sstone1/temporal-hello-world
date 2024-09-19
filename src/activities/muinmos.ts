const {
  MUINMOS_URL = "https://pass-staging.muinmos.com",
  MUINMOS_CLIENT_ID = "",
  MUINMOS_CLIENT_SECRET = "",
  MUINMOS_USERNAME = "",
  MUINMOS_PASSWORD = "",
  MUINMOS_ACCESS_TOKEN = "XXXXXXX",
} = process.env;

export interface GetAssessmentInput {
  assessmentId: string;
}

export interface GetAssessmentOutput {
  [key: string]: unknown;
}

export async function getMuinmosAssessment({
  assessmentId,
}: GetAssessmentInput): Promise<GetAssessmentOutput> {
  const response = await fetch(
    `${MUINMOS_URL}/api/assessment/${assessmentId}`,
    {
      headers: {
        authorization: `Bearer ${MUINMOS_ACCESS_TOKEN}`,
        'X-Version': '2.0'
      },
    }
  );
  if (!response.ok) {
    throw new Error("Unable to get Muinmos assessment " + response.status + " " + (await response.text()))
  }
  const assessment = await response.json()
  return assessment
}
