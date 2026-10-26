/* The site's table of contents. The home page, the subject pages and the
   prev/next links on every topic page are all built from this one list.
   To add a topic: add an entry here and create <subject>/<slug>/index.html. */
window.SITE={
  name:'מירי', slogan:'המורה שלך להצלחה',
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
            { slug:'equation-from-points', title:'משוואת ישר לפי שיפוע ונקודה',
              desc:'יודעים את השיפוע ונקודה אחת (או שתי נקודות)? כך מוצאים את b וכותבים את המשוואה.',
              tags:['מציאת b','שתי נקודות','ביטוי אלגברי','נקודה על הישר'] },
            { slug:'axis-intercepts', title:'נקודות חיתוך עם הצירים',
              desc:'איפה הקו פוגש את ציר y ואת ציר x, ואיך מוצאים את זה מהמשוואה.',
              tags:['חיתוך','ציר x','ציר y','משוואה'] },
            { slug:'triangle-area', title:'שטח משולש בין ישרים לצירים',
              desc:'ישר אחד והצירים, או שני ישרים וציר x, יוצרים משולש. מוצאים את הקודקודים ומחשבים שטח.',
              tags:['שטח משולש','בסיס וגובה','נקודות חיתוך','שני ישרים'] }
          ] }
      ] },
    { id:'english', name:'אנגלית', desc:'בקרוב.', soon:true, chapters:[] },
    { id:'hebrew', name:'עברית', desc:'בקרוב.', soon:true, chapters:[] }
  ]
};
