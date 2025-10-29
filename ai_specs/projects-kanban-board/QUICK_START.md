# 🚀 Quick Start Guide - Projects Kanban Board

## Get Started in 3 Steps

### 1. Start Dev Server
```bash
cd frontend
npm run dev
```

### 2. Open Browser
Navigate to: `http://localhost:3000/projects`

### 3. Test Features
Follow the test scenarios below.

---

## 🧪 Test Scenarios

### Scenario 1: View Projects List
**What to do:**
1. You should see 6 projects displayed in a grid
2. Each project card shows:
   - Project name and avatar
   - Status indicator (green/blue/gray dot)
   - Description
   - Task counts (total and completed)
   - Completion percentage
   - Progress bar

**Expected result:** ✅ All 6 projects visible with correct data

---

### Scenario 2: Search Projects
**What to do:**
1. Type "website" in the search box
2. Only "Website Redesign" project should appear
3. Clear search
4. All projects should reappear

**Expected result:** ✅ Search filters projects correctly

---

### Scenario 3: Create New Project
**What to do:**
1. Click "New Project" button
2. Enter name: "Test Project"
3. Enter description: "This is a test"
4. Select a color from the palette
5. Click "Create Project"

**Expected result:** ✅ 
- Toast: "Project created successfully"
- New project appears in the grid
- Project has correct avatar and color

---

### Scenario 4: Edit Project
**What to do:**
1. Hover over a project card
2. Click the three-dot menu
3. Click "Edit Project"
4. Change the name to "Updated Name"
5. Change status to "Completed"
6. Click "Save Changes"

**Expected result:** ✅
- Toast: "Project updated successfully"
- Project card updates with new name
- Status indicator changes to blue

---

### Scenario 5: View Kanban Board
**What to do:**
1. Click "Kanban" tab
2. Select "Website Redesign" from dropdown
3. You should see 4 columns:
   - Backlog (1 task)
   - To Do (2 tasks)
   - In Progress (1 task)
   - Done (2 tasks)

**Expected result:** ✅ Kanban board displays with correct columns and tasks

---

### Scenario 6: Drag & Drop Task
**What to do:**
1. In Kanban board, grab a task from "To Do"
2. Drag it to "In Progress" column
3. Release the mouse
4. Task should move to the new column

**Expected result:** ✅
- Smooth drag animation
- Task appears in new column
- Column counts update

---

### Scenario 7: Create New Task
**What to do:**
1. Click "+" button in "To Do" column
2. Enter title: "Test Task"
3. Enter description: "Testing task creation"
4. Select priority: "High"
5. Pick a due date
6. Click "Create Task"

**Expected result:** ✅
- Toast: "Task created successfully"
- New task appears in "To Do" column
- Task shows priority badge (orange for High)
- Task shows due date

---

### Scenario 8: Edit Task
**What to do:**
1. Click three-dot menu on a task
2. Click "Edit Task"
3. Change title to "Updated Task"
4. Change priority to "Urgent"
5. Click "Update Task"

**Expected result:** ✅
- Toast: "Task updated successfully"
- Task updates with new title
- Priority badge changes to red (Urgent)

---

### Scenario 9: Delete Task
**What to do:**
1. Click three-dot menu on a task
2. Click "Delete Task"
3. Confirm deletion in dialog

**Expected result:** ✅
- Toast: "Task deleted successfully"
- Task disappears from board
- Column count updates

---

### Scenario 10: Week View
**What to do:**
1. In Kanban board, click "Week" tab
2. You should see 7 day columns
3. Tasks with due dates appear in their respective days
4. Tasks without due dates appear in "No Due Date" section
5. Today's column should be highlighted

**Expected result:** ✅ Week view displays with tasks distributed by date

---

### Scenario 11: Switch Projects
**What to do:**
1. In Kanban board, use project dropdown
2. Select "Mobile App Development"
3. Board should update with new project's tasks

**Expected result:** ✅ 
- Board updates instantly
- Different tasks appear
- Task counts match new project

---

### Scenario 12: Mobile Navigation
**What to do:**
1. Resize browser to mobile width (< 768px)
2. Click hamburger menu (floating button)
3. Click "Projects" in sidebar
4. Page should load
5. Sidebar should auto-close

**Expected result:** ✅ Mobile navigation works smoothly

---

## 📱 Responsive Testing

Test at different breakpoints:

### Mobile (375px - 767px)
- ✅ Single column layout
- ✅ Floating menu button
- ✅ Stack columns vertically
- ✅ Full-width buttons

### Tablet (768px - 1023px)
- ✅ 2 column grid for projects
- ✅ 2 column kanban board
- ✅ Sidebar visible

### Desktop (1024px+)
- ✅ 3 column grid for projects
- ✅ 4 column kanban board
- ✅ Full sidebar

---

## 🎨 Visual Checks

### Colors
- ✅ Project avatars show gradients
- ✅ Status dots: Green (active), Blue (completed), Gray (archived)
- ✅ Priority badges: Blue (low), Yellow (medium), Orange (high), Red (urgent)

### Typography
- ✅ Headings are bold and readable
- ✅ Descriptions are gray and smaller
- ✅ Consistent spacing

### Interactions
- ✅ Hover effects on cards
- ✅ Smooth transitions
- ✅ Loading skeletons
- ✅ Toast notifications

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found: @dnd-kit"
**Solution:** Run `npm install` in frontend directory

### Issue: "date-fns is not defined"
**Solution:** Run `npm install date-fns`

### Issue: Projects not loading
**Solution:** Check browser console for errors, mock API should simulate 500ms delay

### Issue: Drag & drop not working
**Solution:** 
1. Check if using touch screen (mobile)
2. Try mouse instead
3. Check console for errors

### Issue: Build fails
**Solution:**
```bash
cd frontend
npm run lint
npx tsc --noEmit
```

---

## 🔍 Debug Mode

### Open Browser DevTools
```
Chrome: F12 or Cmd+Option+I (Mac)
Firefox: F12 or Cmd+Shift+I (Mac)
```

### Check Console for:
- React Query cache updates
- Mock API calls (300-600ms delays)
- Error messages

### Check Network Tab for:
- No real API calls (everything is mock)
- Fast page loads

---

## ✅ Checklist

Use this checklist to verify everything works:

- [ ] Page loads without errors
- [ ] 6 projects visible in grid
- [ ] Search filters projects
- [ ] Can create new project
- [ ] Can edit project
- [ ] Can delete project (with confirmation)
- [ ] Kanban board displays correctly
- [ ] Can drag tasks between columns
- [ ] Can create new task
- [ ] Can edit task
- [ ] Can delete task (with confirmation)
- [ ] Week view shows 7 days
- [ ] Tasks appear in correct days
- [ ] Can switch between projects
- [ ] Sidebar "Projects" link works
- [ ] Mobile menu works
- [ ] Responsive at all breakpoints
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No lint warnings

---

## 📊 Performance

### Expected Metrics
- **Page load:** < 1 second
- **Mock API response:** 300-600ms
- **Drag & drop:** 60fps smooth
- **Search filter:** Instant

### Monitor in DevTools
```
Performance tab > Record > Interact > Stop
```

---

## 🎯 Success Criteria

✅ **All 12 test scenarios pass**  
✅ **All checklist items checked**  
✅ **No console errors**  
✅ **Responsive on all devices**  
✅ **Smooth interactions**

---

## 📸 Screenshots (Optional)

Take screenshots of:
1. Projects list view
2. Kanban board with all columns
3. Week view
4. Mobile layout
5. Dialogs (create/edit)

---

## 🚀 Next Steps

After testing:
1. Note any bugs or improvements
2. Test with real users
3. Gather feedback
4. Prepare for backend integration (Phase 7)

---

## 💬 Feedback

If you find issues:
1. Note the scenario number
2. Describe what happened vs. what should happen
3. Include browser and device info
4. Check console for errors
5. Take screenshots if helpful

---

**Happy Testing! 🎉**

If all scenarios pass, the frontend implementation is ready for backend integration.
