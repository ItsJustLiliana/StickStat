"use client";

import {CalendarDays,ChevronLeft,ChevronRight,Clock3} from "lucide-react";
import {useEffect,useRef,useState} from "react";

const monthFormatter=new Intl.DateTimeFormat("nl-NL",{month:"long",year:"numeric"});
const dateFormatter=new Intl.DateTimeFormat("nl-NL",{weekday:"short",day:"numeric",month:"short"});
const weekdays=["ma","di","wo","do","vr","za","zo"];

function localIso(date:Date){const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,"0"),day=String(date.getDate()).padStart(2,"0");return `${year}-${month}-${day}`}
function useCloseOutside(open:boolean,close:()=>void){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const pointer=(event:PointerEvent)=>{if(ref.current&&!ref.current.contains(event.target as Node))close()},key=(event:KeyboardEvent)=>{if(event.key==="Escape")close()};document.addEventListener("pointerdown",pointer);document.addEventListener("keydown",key);return()=>{document.removeEventListener("pointerdown",pointer);document.removeEventListener("keydown",key)}},[open,close]);
  return ref;
}

export function StyledDatePicker({name,label}:{name:string;label:string}){
  const today=new Date(),[selected,setSelected]=useState(today),[shownMonth,setShownMonth]=useState(()=>new Date(today.getFullYear(),today.getMonth(),1)),[open,setOpen]=useState(false),close=()=>setOpen(false),ref=useCloseOutside(open,close);
  const firstDay=(shownMonth.getDay()+6)%7,days=new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,0).getDate();
  return <div className="styled-picker-field" ref={ref}><span>{label}</span><input type="hidden" name={name} value={localIso(selected)}/><button className="input picker-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><CalendarDays size={17}/><span>{dateFormatter.format(selected)}</span></button>{open&&<div className="picker-popover calendar-popover" role="dialog" aria-label="Datum kiezen"><div className="calendar-head"><button type="button" aria-label="Vorige maand" onClick={()=>setShownMonth(date=>new Date(date.getFullYear(),date.getMonth()-1,1))}><ChevronLeft size={18}/></button><strong>{monthFormatter.format(shownMonth)}</strong><button type="button" aria-label="Volgende maand" onClick={()=>setShownMonth(date=>new Date(date.getFullYear(),date.getMonth()+1,1))}><ChevronRight size={18}/></button></div><div className="calendar-grid">{weekdays.map(day=><small key={day}>{day}</small>)}{Array.from({length:firstDay},(_,index)=><i key={`blank-${index}`}/>)}{Array.from({length:days},(_,index)=>{const date=new Date(shownMonth.getFullYear(),shownMonth.getMonth(),index+1),value=localIso(date),active=value===localIso(selected),isToday=value===localIso(today);return <button type="button" className={`${active?"selected ":""}${isToday?"today":""}`.trim()} aria-pressed={active} key={value} onClick={()=>{setSelected(date);setOpen(false)}}>{index+1}</button>})}</div></div>}</div>;
}

const hours=Array.from({length:24},(_,index)=>String(index).padStart(2,"0")),minutes=["00","15","30","45"];

export function StyledTimePicker({name,label,defaultValue=""}:{name:string;label:string;defaultValue?:string}){
  const initial=defaultValue.split(":"),[value,setValue]=useState(defaultValue),[hour,setHour]=useState(initial[0]||"19"),[minute,setMinute]=useState(initial[1]||"00"),[open,setOpen]=useState(false),close=()=>setOpen(false),ref=useCloseOutside(open,close);
  return <div className="styled-picker-field" ref={ref}><span>{label}</span><input type="hidden" name={name} value={value}/><button className="input picker-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(current=>!current)}><Clock3 size={17}/><span>{value||"Kies tijd"}</span></button>{open&&<div className="picker-popover time-popover" role="dialog" aria-label={`${label} kiezen`}><div className="time-picker-section"><small>Uur</small><div className="time-hours">{hours.map(option=><button type="button" aria-pressed={hour===option} className={hour===option?"selected":""} key={option} onClick={()=>setHour(option)}>{option}</button>)}</div></div><div className="time-picker-section"><small>Minuten</small><div className="time-minutes">{minutes.map(option=><button type="button" aria-pressed={minute===option} className={minute===option?"selected":""} key={option} onClick={()=>setMinute(option)}>{option}</button>)}</div></div><div className="time-picker-actions"><button type="button" onClick={()=>{setValue("");setOpen(false)}}>Geen tijd</button><button type="button" className="selected" onClick={()=>{setValue(`${hour}:${minute}`);setOpen(false)}}>Kiezen</button></div></div>}</div>;
}
