"use client";

import {Plus, X} from "lucide-react";
import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {matchTaskLabels, matchTaskTypes, type MatchTaskType} from "@/lib/match-tasks";

type Task = {id: string; taskType: MatchTaskType; userId: string; user: {name: string}};
type TeamMember = {id: string; name: string};

export function MatchTasks({matchId, teamId, canEdit, initialTasks, members}: {matchId: string; teamId: string; canEdit: boolean; initialTasks: Task[]; members: TeamMember[]}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false), [taskType, setTaskType] = useState<MatchTaskType>("balls"), [userId, setUserId] = useState(""), [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const tasks = initialTasks.filter(task => members.some(member => member.id === task.userId));

  async function request(method: "POST" | "DELETE", body: Record<string, string>) {
    const response = await fetch(`/api/matches/${matchId}/tasks`, {method, headers: {"content-type": "application/json"}, body: JSON.stringify({teamId, ...body})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? "Opslaan mislukt");
  }
  function add() {
    if (!userId) return;
    setMessage("");
    startTransition(async () => {
      try { await request("POST", {taskType, userId}); setDialogOpen(false); setUserId(""); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Opslaan mislukt"); }
    });
  }
  function remove(taskId: string) {
    setMessage("");
    startTransition(async () => {
      try { await request("DELETE", {taskId}); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Verwijderen mislukt"); }
    });
  }
  return <section className="card match-tasks-card">
    <div className="card-head"><h2>Taken</h2>{canEdit && <button type="button" className="icon-button" aria-label="Taak toevoegen" title="Taak toevoegen" disabled={pending} onClick={() => { setMessage(""); setDialogOpen(true); }}><Plus size={19}/></button>}</div>
    {tasks.length === 0 ? <div className="empty">Nog geen taken aangewezen.</div> : <div className="match-task-sections">
      {matchTaskTypes.map(type => { const assignments = tasks.filter(task => task.taskType === type); return <section className="match-task-section" key={type} aria-labelledby={`match-task-${type}`}><h3 id={`match-task-${type}`}>{matchTaskLabels[type]}</h3>{assignments.length > 0 && <ul>{assignments.map(task => <li key={task.id}><span>{task.user.name}</span>{canEdit && <button className="icon-button" type="button" aria-label={`${task.user.name} verwijderen bij ${matchTaskLabels[type]}`} title="Verwijderen" disabled={pending} onClick={() => void remove(task.id)}><X size={16}/></button>}</li>)}</ul>}</section>; })}
    </div>}
    {message && <p className="form-message" role="alert">{message}</p>}
    {dialogOpen && <div className="lineup-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !pending) setDialogOpen(false); }}><section className="card lineup-dialog match-task-dialog" role="dialog" aria-modal="true" aria-labelledby="match-task-dialog-title"><div className="card-head"><h3 id="match-task-dialog-title">Taak toevoegen</h3><button className="icon-button" type="button" aria-label="Sluiten" disabled={pending} onClick={() => setDialogOpen(false)}><X size={18}/></button></div><label>Taak<select className="input" value={taskType} disabled={pending} onChange={event => setTaskType(event.target.value as MatchTaskType)}>{matchTaskTypes.map(type => <option value={type} key={type}>{matchTaskLabels[type]}</option>)}</select></label><label>Teamlid<select className="input" value={userId} disabled={pending} onChange={event => setUserId(event.target.value)}><option value="">Kies een teamlid</option>{members.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><button className="button match-task-submit" type="button" disabled={pending || !userId} onClick={add}>{pending ? "Opslaan…" : "Toevoegen"}</button>{message && <p className="form-message" role="alert">{message}</p>}</section></div>}
  </section>;
}
