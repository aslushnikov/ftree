app.TreeLoader = class {
    /**
     * @param {string} url
     * @return {!Promise<?app.FamilyTree>}
     */
    static loadCSV(url) {
        console.time("Loaded CSV");
        return fetch(url)
            .then(response => response.text())
            .then(onCSV)
            .catchError(null)

        /**
         * @param {string} text
         */
        function onCSV(text) {
            console.timeEnd("Loaded CSV");
            var json = Papa.parse(text);
            if (!json) {
                console.error("ERROR: failed to parse CSV.");
                return null;
            }
            if (json.errors && json.errors.length) {
                console.error("ERROR: failed t parse CSV. Here are the errors:");
                for (var error of json.errors)
                    console.error(error);
                return null;
            }
            var data = json.data;
            var headers = data.shift();
            if (!validateScheme(headers))
                return null;
            // There's a trailing entry which doesn't have any ID - filter them out.
            data = data.filter(descriptor => !!descriptor[0]);
            var idToPerson = new Map();
            // First pass - create all app.Person instances without mother/father relations.
            for (var descriptor of data) {
                var id = descriptor[0];
                console.assert(!idToPerson.has(id), "ERROR: CSV has duplicate person ID: " + id);
                var firstName = descriptor[2];
                var lastName = descriptor[3] || descriptor[4];
                var gender = app.Gender.Other;
                var genderDescriptor = descriptor[5];
                if (genderDescriptor === "M")
                    gender = app.Gender.Male;
                else if (genderDescriptor === "F")
                    gender = app.Gender.Female;
                var birthYear = descriptor[14];
                var deathYear = descriptor[17];
                var person = new app.Person(firstName, lastName, gender, birthYear, deathYear);
                person.deceased = descriptor[6] === "Y";
                idToPerson.set(id, person);
            }
            // Second pass - set mothers/fathers/children/partners.
            for (var descriptor of data) {
                var person = personForId(idToPerson, descriptor[0]);
                var mother = personForId(idToPerson, descriptor[7]);
                if (mother) {
                    person.mother = mother;
                    mother.children.add(person);
                }
                var father =  personForId(idToPerson, descriptor[9]);
                if (father) {
                    person.father = father;
                    father.children.add(person);
                }
                var partner = personForId(idToPerson, descriptor[11]);
                if (partner) {
                    person.partners.add(partner);
                    partner.partners.add(person);
                }
                // Our rendering engine is very conservative: it allows only one
                // ex-partner. Take the last.
                var exPartner = personForId(idToPerson, descriptor[13].split(' ').pop());
                if (exPartner) {
                    person.partners.add(exPartner);
                    exPartner.partners.add(person);
                }
            }
            var people = Array.from(idToPerson.values());
            // Cleanup those who don't have any meaningful information.
            var filteredPeople = [];
            for (var person of people) {
                if (person.fullName()) {
                    filteredPeople.push(person);
                    continue;
                }
                // Remove backreference to the person.
                for (var child of person.children) {
                    if (child.mother === person)
                        child.mother = null;
                    if (child.father === person)
                        child.father = null;
                }
                for (var partner of person.partners)
                    partner.partners.delete(person);
            }
            return app.FamilyTree.fromPeople(filteredPeople);
        }

        /**
         * @param {!Array<string>} headers
         * @return {boolean}
         */
        function validateScheme(headers) {
            var scheme = {
                0: "ID",
                2: "First names",
                3: "Surname now",
                5: "Gender",
                6: "Deceased",
                7: "Mother ID",
                9: "Father ID",
                11: "Partner ID",
                13: "Ex-partner IDs",
                14: "Birth year",
                17: "Death year",
            };
            var errors = [];
            for (var key of Object.keys(scheme)) {
                var expected = scheme[key];
                var actual = headers[key];
                if (expected.toLowerCase() !== actual.toLowerCase()) {
                    errors.push(`  column #${key}: expected '${expected}', actual '${actual}'`);
                }
            }
            if (errors.length) {
                console.error('ERROR: CSV scheme has changed.\n' + errors.join('\n'));
                return false;
            }
            return true;
        }

        /**
         * @param {!Map<string, !app.Person>} idToPerson
         * @param {string} id
         * @return {?app.Person}
         */
        function personForId(idToPerson, id) {
            if (!id)
                return null;
            var person = idToPerson.get(id);
            console.assert(person, "ERROR: CSV doesn't define person for ID=" + id);
            return person;
        }
    }
}
