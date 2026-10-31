/** Parse Google Contacts / phonebook CSV; never assume access to a WhatsApp-only address book. */
export type ContactInput={name:string;phone:string};
export function parseContactsCsv(text:string):ContactInput[]{
  if(text.length>2_000_000)throw Error('ملف CSV أكبر من 2 ميغابايت');
  const rows:string[][]=[];
  let row:string[]=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted&&text[i+1]==='"'){field+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){row.push(field);field='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      row.push(field);rows.push(row);row=[];field='';
    }else field+=ch;
  }
  if(quoted)throw Error('علامة اقتباس غير مغلقة في CSV');
  if(field||row.length){row.push(field);rows.push(row);}
  if(rows.length<2)return [];
  const headers=rows.shift()!.map(h=>h.replace(/^\uFEFF/,'').trim().toLowerCase());
  const position=(candidates:string[])=>headers.findIndex(h=>candidates.includes(h));
  const nameCol=position(['name','full name','display name','contact name','الاسم','الاسم الكامل']);
  const firstCol=position(['given name','first name','الاسم الأول']);
  const lastCol=position(['family name','last name','اسم العائلة']);
  const phoneCol=position(['phone 1 - value','phone','mobile','phone number','mobile phone','رقم الهاتف','الهاتف','رقم الموبايل']);
  if(phoneCol<0||(nameCol<0&&firstCol<0))throw Error('يلزم عمود Name (أو Given Name) وعمود Phone في CSV');
  return rows.filter(r=>r.some(v=>v.trim())).slice(0,500).map(r=>({
    name:((nameCol>=0?r[nameCol]:[r[firstCol],lastCol<0?'':r[lastCol]].join(' '))||'').trim(),
    phone:(r[phoneCol]||'').trim()
  }));
}
