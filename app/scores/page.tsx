import { Team } from './models';
import TeamsRanking from './TeamsRanking';

const HOST = 'https://pelita.itbportal.biologie.hu-berlin.de/pyapi';

async function getTeams() {
  try {
    const res = await fetch(`${HOST}/team_stats`, {
      next: {
        revalidate: 10,
      },
    });

    if (res.ok) {
      return await res.json();
    }

    console.error(`GET /team_stats: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error(`GET /team_stats failed`, err);
  }

  throw new Error('Failed to fetch teams');
}

async function TeamsPage() {
  const teams = (await getTeams()) as Team[];

  return <TeamsRanking teams={teams}></TeamsRanking>;
}

export default TeamsPage;
