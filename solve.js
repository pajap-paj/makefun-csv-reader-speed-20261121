export function run({text, header}) {
  text=String(text);header=header===true;
  if (text.charCodeAt(0)===65279) text=text.slice(1);
  const rows=[], errors=[]; let columns=null, width=-1;
  let line=1, start=1;
  function issue(code,extra) {
    const e={code,line:start,row:header&&width<0?null:rows.length};
    if(extra) Object.assign(e,extra);
    errors.push(e);
  }
  function record(fields) {
    const n=fields.length;
    if(width<0){width=n;if(header){columns=fields;return;}}
    if(n<width){issue("short_row",{fields:n});for(let k=n;k<width;k++)fields[k]="";}
    else if(n>width){issue("long_row",{extra:fields.slice(width)});fields.length=width;}
    rows.push(fields);
  }
  if(text.indexOf('"')<0 && text.indexOf('\r')<0) {
    const lines=text.split('\n');
    for(let k=0;k<lines.length;k++)if(lines[k]!==""){start=k+1;record(lines[k].split(','));}
    return {columns:header?(columns??[]):null,rows,errors};
  }
  const n=text.length;
  let pos=0, fieldStart=0, fields=[], val="", touched=false, closed=false, first=true, junk=false;
  while(pos<n) {
    const c=text.charCodeAt(pos);
    if(c===34&&first) {
      let q=text.indexOf('"',pos+1);
      while(q!==-1&&text.charCodeAt(q+1)===34) q=text.indexOf('"',q+2);
      if(q!==-1){
        const raw=text.slice(pos+1,q);
        // CRLF, lone CR and LF each count once on subsequent records.
        const breaks=raw.match(/\r\n|[\r\n]/g);
        if(breaks)line+=breaks.length;
        val=raw.replace(/""|\r\n?/g,m=>m==='""'?'"':'\n');
        pos=q+1;fieldStart=pos;touched=true;closed=true;first=false;
        continue;
      }
      issue("unterminated_quote");
      first=false;touched=true;pos++;continue;
    }
    if(c===13&&text.charCodeAt(pos+1)!==10){
      issue("stray_cr");if(closed&&pos>fieldStart)junk=true;val+=text.slice(fieldStart,pos);fieldStart=++pos;first=false;continue;
    }
    if(c===44||c===10||c===13){
      const tail=text.slice(fieldStart,pos);
      if(closed&&(junk||pos>fieldStart))issue("quote_junk");
      if(c===44){
        fields.push(val+tail);touched=true;val="";closed=false;junk=false;first=true;fieldStart=++pos;continue;
      }
      if(touched||fields.length||val.length||tail.length){fields.push(val+tail);record(fields);}
      pos+=c===13?2:1;line++;start=line;
      fields=[];val="";closed=false;junk=false;touched=false;first=true;fieldStart=pos;continue;
    }
    first=false;touched=true;pos++;
  }
  if(touched||fields.length||val.length){
    if(closed&&(junk||fieldStart<n))issue("quote_junk");
    fields.push(val+text.slice(fieldStart,n));record(fields);
  }
  return {columns:header?(columns??[]):null,rows,errors};
}
