/**
 * Seeds a Supabase project with realistic demo data: 1 school, 3 teachers,
 * 8 students, 4 parents, classes, resources, assignments, and progress.
 *
 * Usage: npm run seed
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Demo1234!";

async function createUser(email: string, firstName: string, lastName: string, role: Database["public"]["Tables"]["bp_profiles"]["Row"]["role"]) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !created.user) {
    if (error?.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (existing) {
        const { data: profile } = await supabase.from("bp_profiles").select("*").eq("auth_user_id", existing.id).maybeSingle();
        if (profile) return profile;
      }
    }
    throw error ?? new Error(`Could not create ${email}`);
  }

  const studentCode = role === "student" ? Math.random().toString(36).slice(2, 8).toUpperCase() : null;
  const { data: profile, error: profileError } = await supabase
    .from("bp_profiles")
    .insert({ auth_user_id: created.user.id, first_name: firstName, last_name: lastName, role, student_code: studentCode })
    .select("*")
    .single();
  if (profileError) throw profileError;
  return profile;
}

async function main() {
  console.log("Seeding Brightpath demo data...");

  const { data: school, error: schoolError } = await supabase
    .from("bp_schools")
    .upsert({ name: "Maple Ridge Elementary" }, { onConflict: "name" })
    .select("*")
    .single();
  if (schoolError) throw schoolError;
  console.log(`School: ${school.name}`);

  const teacherSeeds = [
    { email: "teacher1@brightpath.demo", firstName: "Alicia", lastName: "Nguyen" },
    { email: "teacher2@brightpath.demo", firstName: "Marcus", lastName: "Reed" },
    { email: "teacher3@brightpath.demo", firstName: "Priya", lastName: "Shah" },
  ];
  const teachers = [];
  for (const t of teacherSeeds) {
    const profile = await createUser(t.email, t.firstName, t.lastName, "teacher");
    teachers.push(profile);
    await supabase
      .from("bp_school_members")
      .upsert({ school_id: school.id, user_id: profile.id, role: "teacher", status: "approved" }, { onConflict: "school_id,user_id" });
  }
  console.log(`Teachers: ${teachers.length}`);

  const studentSeeds = [
    { email: "student1@brightpath.demo", firstName: "Jayden", lastName: "Carter" },
    { email: "student2@brightpath.demo", firstName: "Sofia", lastName: "Martinez" },
    { email: "student3@brightpath.demo", firstName: "Ethan", lastName: "Wong" },
    { email: "student4@brightpath.demo", firstName: "Ava", lastName: "Johnson" },
    { email: "student5@brightpath.demo", firstName: "Noah", lastName: "Patel" },
    { email: "student6@brightpath.demo", firstName: "Mia", lastName: "Thompson" },
    { email: "student7@brightpath.demo", firstName: "Lucas", lastName: "Kim" },
    { email: "student8@brightpath.demo", firstName: "Zoe", lastName: "Anderson" },
  ];
  const students = [];
  for (const s of studentSeeds) {
    const profile = await createUser(s.email, s.firstName, s.lastName, "student");
    students.push(profile);
  }
  console.log(`Students: ${students.length}`);

  const parentSeeds = [
    { email: "parent1@brightpath.demo", firstName: "Denise", lastName: "Carter" },
    { email: "parent2@brightpath.demo", firstName: "Carlos", lastName: "Martinez" },
    { email: "parent3@brightpath.demo", firstName: "Grace", lastName: "Wong" },
    { email: "parent4@brightpath.demo", firstName: "Robert", lastName: "Johnson" },
  ];
  const parents = [];
  for (const p of parentSeeds) {
    const profile = await createUser(p.email, p.firstName, p.lastName, "parent");
    parents.push(profile);
  }
  console.log(`Parents: ${parents.length}`);

  for (let i = 0; i < parents.length; i++) {
    await supabase.from("bp_parent_student_links").upsert(
      { parent_id: parents[i].id, student_id: students[i].id, relationship: "Parent", status: "approved" },
      { onConflict: "parent_id,student_id" },
    );
  }

  const classSeeds = [
    { name: "Grade 7 Science", grade: "Grade 7", subject: "Science", teacher: teachers[0], students: students.slice(0, 5) },
    { name: "Grade 7 English", grade: "Grade 7", subject: "English", teacher: teachers[1], students: students.slice(2, 8) },
    { name: "Grade 8 History", grade: "Grade 8", subject: "History", teacher: teachers[2], students: students.slice(0, 4) },
  ];

  const classes = [];
  for (const c of classSeeds) {
    const { data: cls, error } = await supabase
      .from("bp_classes")
      .insert({ school_id: school.id, teacher_id: c.teacher.id, name: c.name, grade: c.grade, subject: c.subject })
      .select("*")
      .single();
    if (error) throw error;
    classes.push({ ...cls, roster: c.students });
    for (const student of c.students) {
      await supabase.from("bp_class_members").upsert({ class_id: cls.id, student_id: student.id }, { onConflict: "class_id,student_id" });
    }
  }
  console.log(`Classes: ${classes.length}`);

  const photosynthesisText = `Plants make their own food using sunlight, water, and air. This process is called photosynthesis. It happens mostly in the leaves, inside tiny green parts called chloroplasts. Chlorophyll, the green pigment in chloroplasts, captures light energy. The plant combines that energy with water from the roots and carbon dioxide from the air to produce glucose and oxygen. Oxygen is released into the air, which is part of why plants are so important to life on Earth. Without photosynthesis, most food chains would not exist.`;

  const revolutionText = `The Industrial Revolution began in Britain in the late 1700s. New machines changed how goods were made, moving production from homes to factories. Steam power drove textile mills and later, railways. Cities grew quickly as people moved from farms to find factory work. Working conditions were often difficult, with long hours and little safety regulation. Over time, new laws improved conditions and gave workers more rights.`;

  const resourceSeeds = [
    { title: "Photosynthesis — Grade 7", subject: "Science", text: photosynthesisText, owner: teachers[0], classIndex: 0 },
    { title: "The Industrial Revolution", subject: "History", text: revolutionText, owner: teachers[2], classIndex: 2 },
  ];

  for (const r of resourceSeeds) {
    const { data: resource, error } = await supabase
      .from("bp_resources")
      .insert({
        owner_id: r.owner.id,
        school_id: school.id,
        title: r.title,
        subject: r.subject,
        extracted_text: r.text,
        extracted_structure: { title: r.title, sections: [{ heading: null, paragraphs: r.text.split(". ").map((s) => s.trim() + (s.endsWith(".") ? "" : ".")) }], questions: [], vocabulary: [], rawText: r.text },
        status: "ready",
        is_seed: true,
      })
      .select("*")
      .single();
    if (error) throw error;

    const cls = classes[r.classIndex];
    const { data: assignment, error: assignError } = await supabase
      .from("bp_assignments")
      .insert({
        teacher_id: r.owner.id,
        class_id: cls.id,
        resource_id: resource.id,
        title: `Read: ${r.title}`,
        description: "Read through the material and complete the reflection below.",
        instructions: "Read the passage, then write two or three sentences about the main idea.",
        subject: r.subject,
        due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      .select("*")
      .single();
    if (assignError) throw assignError;

    for (const [i, student] of cls.roster.entries()) {
      const status = i % 3 === 0 ? "submitted" : i % 3 === 1 ? "in_progress" : "not_started";
      await supabase.from("bp_submissions").upsert(
        {
          assignment_id: assignment.id,
          student_id: student.id,
          status,
          content: status === "submitted" ? { text: "The main idea is that plants convert sunlight into energy they can use to grow." } : null,
          submitted_at: status === "submitted" ? new Date().toISOString() : null,
        },
        { onConflict: "assignment_id,student_id" },
      );

      if (status !== "not_started") {
        await supabase.from("bp_progress_events").insert({
          student_id: student.id,
          resource_id: resource.id,
          event_type: "reading_session",
          metadata: { source: "seed" },
        });
      }
    }
  }

  console.log("Adding sample progress history...");
  for (const student of students.slice(0, 6)) {
    for (let d = 0; d < 10; d++) {
      if (Math.random() > 0.5) continue;
      const created = new Date();
      created.setDate(created.getDate() - d);
      await supabase.from("bp_progress_events").insert({
        student_id: student.id,
        event_type: Math.random() > 0.5 ? "reading_session" : "practice_completed",
        metadata: { source: "seed" },
        created_at: created.toISOString(),
      });
    }
  }

  console.log("\nDone. Demo accounts (password: Demo1234!):");
  console.log(teacherSeeds.map((t) => t.email).join(", "));
  console.log(studentSeeds.map((s) => s.email).join(", "));
  console.log(parentSeeds.map((p) => p.email).join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
