// let char = "aaabccdddd";
// let result = "";
// let count = 1;
// for (let x = 0; x < char.length; x++) {
//   if (char[x] === char[x + 1]) {
//     count++;
//   } else {
//     result += count + char[x];
//     count = 1;
//   }
// }

// console.log(result);

// String str = "aaabccdddd";

// StringBuilder result = new StringBuilder();

// int count = 1;

// // Loop stops at length - 1 so that x + 1 is always safe

// for (int x = 0; x < str.length()-1; x++) {

//     if (str.charAt(x) == str.charAt(x + 1)) {

//         count++;

//     } else {

//         result.append(count).append(str.charAt(x));

//         count = 1;

//     }

// }

// System.out.println(result.toString()); // Output: 3a1b2c4d

// public class BracketMatcherArray {

//     public static boolean isBalanced(String expression) {
//         int n = expression.length();
        
//         char[] stack = new char[n];
//         int top = -1;

//         for (int i = 0; i < n; i++) {
//             char current = expression.charAt(i);

//             if (current == '(' || current == '{' || current == '[') {
//                 stack[++top] = current;
//             } 
//             else if (current == ')' || current == '}' || current == ']') {
                
//                 if (top == -1) {
//                     return false;
//                 }

//                 char lastOpened = stack[top--];

//                 if (!isMatchingPair(lastOpened, current)) {
//                     return false;
//                 }
//             }
//         }
//         return (top == -1);
//     }

//     private static boolean isMatchingPair(char open, char close) {
//         return (open == '(' && close == ')') ||
//                (open == '{' && close == '}') ||
//                (open == '[' && close == ']');
//     }

//     public static void main(String[] args) {
//         String input = "{[()]}";
//         if (isBalanced(input)) {
//             System.out.println("Balanced");
//         } else {
//             System.out.println("Not Balanced");
//         }
//     }
// }


public class Solution {

    public static boolean isBalanced(String input) {
        int n = input.length();
        if (n % 2 != 0) return false;

        char[] ch = new char[n];
        int p = 0;

        for (int i = 0; i < n; i++) {
            char c = input.charAt(i);

            if (c == '(' || c == '{' || c == '[') {
                ch[p++] = c;
            } else if (c == ')' || c == '}' || c == ']') {
                if (p == 0) return false;
                
                char last = ch[--p];
                if (!((c == ')' && last == '(') || 
                      (c == '}' && last == '{') || 
                      (c == ']' && last == '['))) {
                    return false;
                }
            }
        }
        return p == 0;
    }

    public static void main(String[] args) {
        String test = "{[()]}";
        System.out.println(isBalanced(test));
    }
}

class Solution {
    public int strStr(String haystack, String needle) {
        int n = haystack.length();
        int m = needle.length();
        if (m == 0) return 0;

        for (int i = 0; i <= n - m; i++) {
            
            int j = 0;
            while (j < m) {
                if (haystack.charAt(i + j) != needle.charAt(j)) {
                    break;
                }
                j++;
            }

            if (j == m) {
                return i;
            }
        }
        return -1;
    }
}