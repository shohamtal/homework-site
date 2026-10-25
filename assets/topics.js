/* The site's table of contents. The home page, the subject pages and the
   prev/next links on every topic page are all built from this one list.
   To add a topic: add an entry here and create <subject>/<slug>/index.html. */
window.SITE={
  name:'אתר שיעורי הבית',
  subjects:[
    { id:'math', name:'חשבון', desc:'הסברים, מעבדות ותרגול לפי נושאים.',
      chapters:[
        { id:'linear', name:'פונקציה קווית', grade:'כיתה ח',
          topics:[
            { slug:'equation-from-graph', title:'משוואת ישר מתוך גרף',
              desc:'מה זה m ומה זה b, ואיך מוצאים את המשוואה של קו רק מהסתכלות על הגרף.',
              tags:['שיפוע','y = mx + b','התאמת גרפים'] },
            { slug:'draw-line', title:'ציור ישר לפי משוואה',
              desc:'מקבלים משוואה ומציירים את הקו: בעזרת טבלת ערכים, או בעזרת b והשיפוע.',
              tags:['טבלת ערכים','הצבה','ציור גרף'] },
            { slug:'slope-two-points', title:'שיפוע בין שתי נקודות',
              desc:'איך מחשבים שיפוע כשנותנים רק שתי נקודות, בלי גרף.',
              tags:['שיפוע','נוסחת השיפוע','נקודות'] },
            { slug:'axis-intercepts', title:'נקודות חיתוך עם הצירים',
              desc:'איפה הקו פוגש את ציר y ואת ציר x, ואיך מוצאים את זה מהמשוואה.',
              tags:['חיתוך','ציר x','ציר y','משוואה'] }
          ] }
      ] },
    { id:'english', name:'אנגלית', desc:'בקרוב.', soon:true, chapters:[] },
    { id:'hebrew', name:'עברית', desc:'בקרוב.', soon:true, chapters:[] }
  ]
};
