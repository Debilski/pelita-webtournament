import { Team } from './models';
import TeamsRanking from './TeamsRanking';

const HOST = "https://pelita.itbportal.biologie.hu-berlin.de/pyapi"

async function getTeams() {
  const res = await fetch(`${HOST}/team_stats`, {
    // cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

async function TeamsPage() {
  const teams = await getTeams() as Team[];

  return <TeamsRanking teams={teams}></TeamsRanking>;
}

export default TeamsPage;
