import { Team } from './models';
import TeamsRanking from './TeamsRanking';

const HOST = "https://pelita.itbportal.biologie.hu-berlin.de/pyapi"

async function getTeams() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${HOST}/team_stats`, {
        cache: 'no-store',
      });

      if (res.ok) {
        return res.json();
      }

      console.error(
        `GET /team_stats attempt ${attempt + 1}: ${res.status} ${res.statusText}`,
      );
    } catch (err) {
      console.error(`GET /team_stats attempt ${attempt + 1} failed`, err);
    }

    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }

  throw new Error('Failed to fetch teams after 3 attempts');
}

async function TeamsPage() {
  const teams = await getTeams() as Team[];

  return <TeamsRanking teams={teams}></TeamsRanking>;
}

export default TeamsPage;
