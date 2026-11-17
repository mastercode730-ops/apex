import type { Player, Role } from './types';
type Row = [string, Role];
const squads: Record<string, Row[]> = {
  ind: [['Rohit Sharma','Batter'],['Shubman Gill','Batter'],['Virat Kohli','Batter'],['Shreyas Iyer','Batter'],['KL Rahul','Wicketkeeper'],['Hardik Pandya','All-rounder'],['Ravindra Jadeja','All-rounder'],['Kuldeep Yadav','Bowler'],['Mohammed Siraj','Bowler'],['Jasprit Bumrah','Bowler'],['Arshdeep Singh','Bowler']],
  aus: [['Travis Head','Batter'],['Mitchell Marsh','All-rounder'],['Steve Smith','Batter'],['Marnus Labuschagne','Batter'],['Alex Carey','Wicketkeeper'],['Glenn Maxwell','All-rounder'],['Cameron Green','All-rounder'],['Pat Cummins','Bowler'],['Mitchell Starc','Bowler'],['Adam Zampa','Bowler'],['Josh Hazlewood','Bowler']],
  eng: [['Ben Duckett','Batter'],['Phil Salt','Wicketkeeper'],['Joe Root','Batter'],['Harry Brook','Batter'],['Jos Buttler','Wicketkeeper'],['Ben Stokes','All-rounder'],['Liam Livingstone','All-rounder'],['Jofra Archer','Bowler'],['Mark Wood','Bowler'],['Adil Rashid','Bowler'],['Brydon Carse','Bowler']],
  nz: [['Devon Conway','Batter'],['Rachin Ravindra','All-rounder'],['Kane Williamson','Batter'],['Daryl Mitchell','All-rounder'],['Tom Latham','Wicketkeeper'],['Glenn Phillips','All-rounder'],['Mitchell Santner','All-rounder'],['Matt Henry','Bowler'],['Kyle Jamieson','Bowler'],['Trent Boult','Bowler'],['Ish Sodhi','Bowler']],
  sa: [['Ryan Rickelton','Wicketkeeper'],['Aiden Markram','Batter'],['Temba Bavuma','Batter'],['Tristan Stubbs','Batter'],['Heinrich Klaasen','Wicketkeeper'],['Marco Jansen','All-rounder'],['Wiaan Mulder','All-rounder'],['Keshav Maharaj','Bowler'],['Kagiso Rabada','Bowler'],['Lungi Ngidi','Bowler'],['Simon Harmer','Bowler']],
  pak: [['Fakhar Zaman','Batter'],['Saim Ayub','Batter'],['Babar Azam','Batter'],['Mohammad Rizwan','Wicketkeeper'],['Salman Agha','All-rounder'],['Shadab Khan','All-rounder'],['Faheem Ashraf','All-rounder'],['Shaheen Afridi','Bowler'],['Naseem Shah','Bowler'],['Haris Rauf','Bowler'],['Abrar Ahmed','Bowler']],
  sl: [['Pathum Nissanka','Batter'],['Kusal Mendis','Wicketkeeper'],['Kamindu Mendis','All-rounder'],['Charith Asalanka','Batter'],['Angelo Mathews','All-rounder'],['Dhananjaya de Silva','All-rounder'],['Wanindu Hasaranga','All-rounder'],['Maheesh Theekshana','Bowler'],['Matheesha Pathirana','Bowler'],['Dushmantha Chameera','Bowler'],['Asitha Fernando','Bowler']],
  ban: [['Tanzid Hasan','Batter'],['Najmul Hossain Shanto','Batter'],['Litton Das','Wicketkeeper'],['Mushfiqur Rahim','Wicketkeeper'],['Towhid Hridoy','Batter'],['Mehidy Hasan Miraz','All-rounder'],['Shakib Al Hasan','All-rounder'],['Taskin Ahmed','Bowler'],['Mustafizur Rahman','Bowler'],['Taijul Islam','Bowler'],['Hasan Mahmud','Bowler']],
  afg: [['Rahmanullah Gurbaz','Wicketkeeper'],['Ibrahim Zadran','Batter'],['Rahmat Shah','Batter'],['Hashmatullah Shahidi','Batter'],['Azmatullah Omarzai','All-rounder'],['Mohammad Nabi','All-rounder'],['Rashid Khan','Bowler'],['Noor Ahmad','Bowler'],['Fazalhaq Farooqi','Bowler'],['Mujeeb Ur Rahman','Bowler'],['Naveen-ul-Haq','Bowler']],
  wi: [['Brandon King','Batter'],['Evin Lewis','Batter'],['Shai Hope','Wicketkeeper'],['Nicholas Pooran','Wicketkeeper'],['Rovman Powell','Batter'],['Shimron Hetmyer','Batter'],['Jason Holder','All-rounder'],['Andre Russell','All-rounder'],['Akeal Hosein','Bowler'],['Alzarri Joseph','Bowler'],['Shamar Joseph','Bowler']],
};
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const players: Player[] = Object.entries(squads).flatMap(([teamId, rows]) =>
  rows.map(([name, role], i) => ({
    id: slugify(name), name, teamId, role,
    battingStyle: i % 3 === 0 ? 'Left-hand bat' : 'Right-hand bat',
    bowlingStyle: role === 'Bowler' ? (i % 2 ? 'Right-arm fast' : 'Left-arm orthodox') : role === 'All-rounder' ? 'Right-arm medium' : '-',
    born: `${1986 + ((i * 7 + teamId.length) % 14)}`,
  })),
);
export const playerById = (id: string) => players.find((p) => p.id === id);
export const squadOf = (teamId: string) => players.filter((p) => p.teamId === teamId);
