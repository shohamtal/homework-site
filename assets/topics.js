/* The site's table of contents: subject › grade › chapter › topic. The home page, the subject and grade pages,
   breadcrumbs and prev/next links are all built from this one list (scripts/build.mjs).
   To add a topic: add an entry here, create <subject>/<slug>/index.html, run `node scripts/build.mjs`.
   chapter.grade must match a name in subject.grades. aka: names of the same material in assets/curriculum.js,
   so the request form marks them "כבר באתר". related: slugs linked under "כדאי לחזור גם על" at the end of the page. */
window.SITE={
  name:'מירי', slogan:'המורה שלך להצלחה',
  subjects:[
    { id:'math', name:'מתמטיקה', desc:'הסברים, מעבדות ותרגול לפי כיתה ונושא.',
      grades:[ {id:'grade-7', name:'כיתה ז'}, {id:'grade-8', name:'כיתה ח'}, {id:'grade-9', name:'כיתה ט'} ],
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
          ] },
        { id:'systems', name:'מערכת של שתי משוואות', grade:'כיתה ח',
          topics:[
            { slug:'systems-graph', related:['draw-line','equation-from-points'], title:'פתרון גרפי של מערכת משוואות', aka:['מערכת של שתי משוואות','מערכות משוואות'],
              desc:'שני ישרים נפגשים בנקודה אחת. הנקודה הזאת היא הפתרון של שתי המשוואות ביחד.',
              tags:['נקודת חיתוך','שני ישרים','פתרון גרפי'] },
            { slug:'systems-algebra', related:['systems-graph'], title:'מערכת משוואות: שיטת ההצבה וההשוואה',
              desc:'פותרים מערכת של שתי משוואות בלי גרף: בשיטת ההצבה או בשיטת השוואת המקדמים.',
              tags:['שיטת ההצבה','השוואת מקדמים','שני נעלמים'] }
          ] },
        { id:'inequalities', name:'אי-שוויונות', grade:'כיתה ח',
          topics:[
            { slug:'inequalities', related:['systems-algebra'], title:'אי-שוויונות ממעלה ראשונה', aka:['אי-שוויונות'],
              desc:'פותרים אי-שוויון כמו משוואה, עם כלל אחד חשוב: כופלים או מחלקים במספר שלילי? הסימן מתהפך. ומציירים את הפתרון על ציר המספרים.',
              tags:['ציר המספרים','היפוך סימן','גדול מ, קטן מ'] }
          ] },
        { id:'algebra', name:'כפל מקוצר ופירוק לגורמים', grade:'כיתה ח',
          topics:[
            { slug:'short-multiplication', title:'נוסחאות הכפל המקוצר', aka:['נוסחאות הכפל המקוצר'],
              desc:'למה (a + b)² הוא לא a² + b²? רואים את זה בציור של ריבוע, ולומדים את שלוש הנוסחאות.',
              tags:['(a + b)²','(a − b)²','הפרש ריבועים'] },
            { slug:'factoring', related:['short-multiplication'], title:'פירוק לגורמים', aka:['פירוק לגורמים'],
              desc:'הופכים סכום למכפלה: הוצאת גורם משותף, ושימוש בנוסחאות הכפל המקוצר בכיוון ההפוך.',
              tags:['גורם משותף','הפרש ריבועים','פירוק'] }
          ] },
        { id:'powers', name:'חזקות ושורשים', grade:'כיתה ח',
          topics:[
            { slug:'powers-roots', title:'חוקי חזקות ושורשים', aka:['חזקות ושורשים'],
              desc:'מה קורה כשכופלים חזקות, מחלקים אותן או מעלים חזקה בחזקה. ומה זה שורש ריבועי.',
              tags:['חזקה','מעריך','שורש ריבועי'] }
          ] },
        { id:'geometry', name:'גאומטריה', grade:'כיתה ח',
          topics:[
            { slug:'pythagoras', related:['powers-roots','quadrilaterals'], title:'משפט פיתגורס', aka:['משפט פיתגורס'],
              desc:'במשולש ישר זווית, סכום הריבועים של הניצבים שווה לריבוע של היתר. רואים למה, ומוצאים צלע חסרה.',
              tags:['משולש ישר זווית','יתר','ניצבים'] },
            { slug:'congruence', title:'חפיפת משולשים', aka:['חפיפת משולשים'],
              desc:'מתי שני משולשים חופפים? ארבעת משפטי החפיפה: צ.ז.צ, ז.צ.ז, צ.צ.צ ו-צ.צ.ז, ואיך כותבים הוכחה קצרה.',
              tags:['צ.ז.צ','ז.צ.ז','צ.צ.צ','הוכחה'] },
            { slug:'quadrilaterals', related:['congruence'], title:'מרובעים: מקבילית, מלבן, מעוין, ריבוע וטרפז', aka:['מרובעים: מקבילית, מעוין, מלבן, ריבוע','טרפז'],
              desc:'מה מיוחד בכל מרובע, מה משותף להם, ואיך מזהים כל אחד לפי הצלעות, הזוויות והאלכסונים. כולל טרפז.',
              tags:['מקבילית','מעוין','טרפז','אלכסונים'] }
          ] },
        { id:'solids', name:'נפח ושטח פנים', grade:'כיתה ח',
          topics:[
            { slug:'solids', related:['pythagoras'], title:'נפח ושטח פנים של גופים', aka:['נפח ושטח פנים של גופים'],
              desc:'תיבה, מנסרה וגליל: איך מחשבים כמה נכנס בתוכם (נפח) וכמה נייר צריך כדי לעטוף אותם (שטח פנים).',
              tags:['תיבה','מנסרה','גליל','פריסה'] }
          ] },
        { id:'stats', name:'סטטיסטיקה והסתברות', grade:'כיתה ח',
          topics:[
            { slug:'statistics', title:'ממוצע, חציון ושכיח', aka:['ממוצע, חציון ושכיח'],
              desc:'שלוש דרכים לתאר קבוצת מספרים במספר אחד. מתי כל אחת מתאימה, ומה קורה כשמוסיפים ערך חריג.',
              tags:['ממוצע','חציון','שכיח','ערך חריג'] },
            { slug:'probability', related:['statistics'], title:'הסתברות: מה הסיכוי?', aka:['הסתברות'],
              desc:'מחשבים הסתברות כשבר: המקרים שמתאימים, חלקי כל המקרים. ובודקים בניסוי אם זה באמת יוצא ככה.',
              tags:['סיכוי','מאורע','ניסוי'] }
          ] }
      ] },
    { id:'english', name:'אנגלית', desc:'בקרוב.', soon:true, chapters:[] },
    { id:'hebrew', name:'עברית', desc:'בקרוב.', soon:true, chapters:[] }
  ]
};
