'use client';

import { useEffect, useState } from 'react';
import React from 'react';

import PelitaReplay from '@/app/pelita_replay';
import { ColoredDot } from '@/app/utils/utils';

import { Team, Match, WinsLosses } from './models';

const HOST = "https://pelita.itbportal.biologie.hu-berlin.de/pyapi"

function Matches({
  team,
  opponent,
  setReplayUUID,
}: {
  team: string;
  opponent: string;
  setReplayUUID: (uuid: string) => void;
}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(`${HOST}/team_opponent/matches/${team}/${opponent}`)
      .then(r => r.json())
      .then(data => {
        setMatches(prev => data);
      });
  }, []);

  function DisplayMatch({ match }: { match: Match }) {
    let color = 'red';
    switch (match.outcome) {
      case 0:
        color = 'red';
        break;
      case 1:
        color = 'orange';
        break;
      case 2:
        color = 'lightgreen';
        break;
      default:
        break;
    }
    return (
      <>
        <ColoredDot color={color}></ColoredDot>
        {''}
      </>
    );
  }

  return (
    <>
      {matches.map(m => (
        <span key={m.game_uuid} onClick={() => { setReplayUUID(m.game_uuid); }}>
          <DisplayMatch match={m}></DisplayMatch>
        </span>
      ))}
    </>
  );
}

function TeamsRanking({ teams }: { teams: Team[] }) {
  const [expandTeam, setExpandTeam] = useState<string | null>(null);
  const [winsLosses, setWinsLosses] = useState<Record<string, WinsLosses[]>>({});
  const [matches, setMatches] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const [replayUUID, setReplayUUID] = useState<string | null>(null);

  async function toggleTeam(slug: string) {
    if (expandTeam === slug) {
      setExpandTeam(null);
      return;
    }

    setExpandTeam(slug);

    // already cached locally → no refetch
    if (winsLosses[slug]) return;

    setLoading(true);
    try {
      const res = await fetch(`${HOST}/team_matches/${slug}`);
      const data = await res.json();

      setWinsLosses(prev => ({
        ...prev,
        [slug]: data,
      }));
    } finally {
      setLoading(false);
    }
  }

  const headers = [
    'Team',
    '# Matches',
    '# Wins',
    '# Draws',
    '# Losses',
    'Score',
    'μ',
    'σ',
    '# Timeouts',
    '# Fatal Errors',
  ];

  return (
    <>
      {/* <div className="w-sm">
        <PelitaReplay
          src="http://localhost:8000/game_replay/f09b7e25-c13e-4759-8bb0-1a5fd2fed147"
          rawGameState={true}
        ></PelitaReplay>
      </div> */}

      <h1>CI stats and replays</h1>

      <div className="relative overflow-x-auto shadow-xs rounded border">
        <table className="w-full text-sm text-left rtl:text-right">
          <thead className="text-sm border-b-4 rounded border">
            <tr>
              {headers.map(header => (
                <th key={header} className="px-6 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.toSorted((a, b) => a.score - b.score).toReversed().map(team => {
              const team_name = `${team.slug} (${team.display_name})`;
              const padding =
                expandTeam === team.slug && !loading && winsLosses[team.slug]
                  ? 'pt-4 py-0.5'
                  : 'py-4';

              return (
                <React.Fragment key={team.id}>
                  <tr className="border-t hover:bg-amber-50" onClick={() => toggleTeam(team.slug)}>
                    <td className={`px-6 ${padding}`}>{team_name}</td>
                    <td className={`px-6 ${padding}`}>{team.wins + team.draws + team.losses}</td>
                    <td className={`px-6 ${padding}`}>{team.wins}</td>
                    <td className={`px-6 ${padding}`}>{team.draws}</td>
                    <td className={`px-6 ${padding}`}>{team.losses}</td>
                    <td className={`px-6 ${padding}`}>{team.score < 0 ? "" : <>&nbsp;</>}{team.score.toFixed(2)}</td>
                    <td className={`px-6 ${padding}`}>{team.mu.toFixed(2)}</td>
                    <td className={`px-6 ${padding}`}>{team.sigma.toFixed(2)}</td>
                    <td className={`px-6 ${padding}`}>{team.num_timeouts}</td>
                    <td className={`px-6 ${padding}`}>{team.num_fatals}</td>
                  </tr>

                  {expandTeam === team.slug && loading && !winsLosses[team.slug] && (
                    <tr>
                      <td colSpan={10}>
                        <p>Loading...</p>
                      </td>
                    </tr>
                  )}

                  {expandTeam === team.slug && !loading && winsLosses[team.slug] && (
                    <>
                      {winsLosses[team.slug].map((a, idx) => {
                        const total = a.draws + a.wins + a.losses;
                        const score = (a.wins - a.losses) / total;
                        const padding =
                          idx === winsLosses[team.slug].length - 1 ? 'pb-4 py-0.5' : 'py-0.5';
                        return (
                          <tr key={a.opponent} className='hover:bg-amber-50 dark:hover:bg-gray-700'>
                            <td className={`px-6 ${padding}`}>ᗧ {a.opponent}</td>
                            <td className={`px-6 ${padding}`}>{total}</td>
                            <td className={`px-6 ${padding}`}>{a.wins}</td>
                            <td className={`px-6 ${padding}`}>{a.draws}</td>
                            <td className={`px-6 ${padding}`}>{a.losses}</td>
                            <td className={`px-6 ${padding}`}>{score < 0 ? "" : <>&nbsp;</>}{score.toFixed(2)}</td>
                            <td className={`px-6 ${padding}`} colSpan={4}>
                              <Matches
                                team={team.slug}
                                opponent={a.opponent}
                                setReplayUUID={uuid => setReplayUUID(uuid)}
                              ></Matches>
                            </td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {replayUUID && (
        <div
          className="fixed inset-0 bg-white/50 dark:bg-black/50"
          onClick={() => {
            setReplayUUID(null);
          }}
        >
          <aside className="absolute flex justify-center items-center inset-0">
            <div className=" border rounded bg-white dark:bg-gray-800 p-8 w-1/2" onClick={e => e.stopPropagation()}>
              <PelitaReplay
                src={`${HOST}/game_replay/${replayUUID}`}
                rawGameState={true}
                startEnd={true}
                hasQuit={true}
                hasFF={true}
                onQuit={() => setReplayUUID(null)}
              ></PelitaReplay>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default TeamsRanking;
